import hmac
import json
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from config import settings
from database.connection import get_db
from models.db_models import Subtask, Task
from models.schemas import (
    AIExtractedTask,
    AIExtractRequest,
    AIExtractResponse,
    AIIngestRequest,
    AIIngestResponse,
    IntegrationStatusResponse,
    TaskResponse,
)
from security import extract_session_token, verify_session_token

logger = logging.getLogger("lemon_stain")

router = APIRouter(prefix="/api/integrations", tags=["Integrations & AI"])


def verify_integration_auth(request: Request, db: Session = Depends(get_db)) -> Optional[str]:
    """Allows calls from either an authenticated dashboard session or an external
    automation presenting the shared X-Integration-Key header / Bearer token."""
    expected_key = settings.effective_integration_key

    # 1. Check direct header: X-Integration-Key
    provided_key = request.headers.get("x-integration-key") or request.headers.get("X-Integration-Key")
    if provided_key:
        if hmac.compare_digest(provided_key.strip(), expected_key):
            return "integration_key"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid X-Integration-Key provided.",
        )

    # 2. Check Authorization header: Bearer <key_or_token>
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            bearer_val = parts[1].strip()
            # Could be the integration key
            if hmac.compare_digest(bearer_val, expected_key):
                return "integration_key"
            # Or could be an active dashboard user session token
            user_id = verify_session_token(bearer_val, db, request.headers.get("user-agent", ""))
            if user_id is not None:
                return f"user_{user_id}"

    # 3. Check session cookie for signed-in dashboard users
    cookie_token = extract_session_token(request)
    if cookie_token:
        user_id = verify_session_token(cookie_token, db, request.headers.get("user-agent", ""))
        if user_id is not None:
            return f"user_{user_id}"

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized. Provide a valid X-Integration-Key header or sign in to your dashboard.",
    )


async def call_gemini_extraction(
    content: str,
    context: str,
    api_key: str,
    model: str = "gemini-2.5-flash",
) -> dict:
    """Invokes the Gemini API using structured JSON schema output to parse action items."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    prompt = (
        f"You are an executive assistant for a personal dashboard called Lemon & Stain.\n"
        f"Your job is to read incoming communication (email, calendar invite, chat message, or notes) and determine if there are concrete action items or tasks required of the recipient.\n\n"
        f"Guidelines:\n"
        f"- Ignore marketing, automated alerts, newsletter blasts, general announcements, or receipts unless an explicit action (like paying or reviewing) is required of the user.\n"
        f"- For each genuine task, extract:\n"
        f"  * title: Concise, active imperative verb phrase (e.g. 'Submit revised thesis proposal to Dr. Ellis').\n"
        f"  * category: Exactly one of ['Grad School', 'Work', 'Bills', 'Personal'].\n"
        f"  * priority: 'Zoomies' for urgent/high-priority, 'Purr-fect' for normal, 'Catnap' for low/whenever.\n"
        f"  * due_date: YYYY-MM-DD if a deadline is mentioned or strongly implied, otherwise null.\n"
        f"  * notes: Essential context, sender, subject, key requirements, or relevant links.\n"
        f"  * subtasks: List of concise steps if multiple steps were mentioned.\n\n"
        f"Context of message: {context}\n"
        f"Message content:\n{content}"
    )

    request_body = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "has_action_items": {
                        "type": "BOOLEAN",
                        "description": "True if there is at least one action item or task for the user"
                    },
                    "summary": {
                        "type": "STRING",
                        "description": "Brief 1-sentence summary of the scan result"
                    },
                    "tasks": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "title": {"type": "STRING"},
                                "category": {
                                    "type": "STRING",
                                    "enum": ["Grad School", "Work", "Bills", "Personal"]
                                },
                                "priority": {
                                    "type": "STRING",
                                    "enum": ["Zoomies", "Purr-fect", "Catnap"]
                                },
                                "due_date": {"type": "STRING"},
                                "notes": {"type": "STRING"},
                                "subtasks": {
                                    "type": "ARRAY",
                                    "items": {"type": "STRING"}
                                }
                            },
                            "required": ["title", "category", "priority"]
                        }
                    }
                },
                "required": ["has_action_items", "tasks"]
            }
        }
    }

    try:
        async with httpx.AsyncClient(timeout=35.0) as client:
            resp = await client.post(url, json=request_body)
    except httpx.HTTPError as exc:
        logger.error("Failed to connect to Gemini API: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"Failed to connect to Gemini API: {exc.__class__.__name__}",
        )

    if resp.status_code != 200:
        logger.error("Gemini API error (%s): %s", resp.status_code, resp.text)
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API returned HTTP {resp.status_code}: {resp.text[:300]}",
        )

    data = resp.json()
    try:
        candidate_text = data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(candidate_text)
    except (KeyError, IndexError, json.JSONDecodeError) as err:
        logger.error("Failed to parse Gemini API JSON response: %s (Raw: %s)", err, data)
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse structured response from Gemini API: {err}",
        )


@router.post("/ai-tasks", response_model=AIIngestResponse)
def ingest_ai_tasks(
    payload: AIIngestRequest,
    db: Session = Depends(get_db),
    _auth=Depends(verify_integration_auth),
):
    """Webhook endpoint called by Google Apps Script or external automation to create tasks."""
    if not payload.tasks:
        return AIIngestResponse(
            success=True,
            added_count=0,
            skipped_count=0,
            tasks=[],
            message="No tasks provided in request.",
        )

    # Fetch existing tasks to deduplicate
    existing_tasks = db.query(Task).all()
    existing_titles = {t.title.strip().lower() for t in existing_tasks}
    existing_sources = {t.source.strip().lower() for t in existing_tasks if t.source}

    added_tasks = []
    skipped_count = 0

    for item in payload.tasks:
        source_label = item.source or "Gmail"
        source_key = f"{source_label}: {item.source_id}".strip() if item.source_id else source_label

        # Deduplication check:
        # 1. If source_id matches an existing task source
        # 2. Or exact title match exists
        if (item.source_id and source_key.lower() in existing_sources) or (item.title.strip().lower() in existing_titles):
            skipped_count += 1
            continue

        new_task = Task(
            title=item.title.strip(),
            category=item.category if item.category in {"Grad School", "Work", "Bills", "Personal"} else "Work",
            priority=item.priority if item.priority in {"Zoomies", "Purr-fect", "Catnap"} else "Purr-fect",
            due_date=item.due_date,
            source=source_key[:100],
            status="Pending",
            completed=False,
            notes=item.notes or "",
        )
        db.add(new_task)
        db.flush()

        for idx, sub_title in enumerate(item.subtasks or []):
            if sub_title and sub_title.strip():
                sub = Subtask(
                    task_id=new_task.id,
                    title=sub_title.strip()[:255],
                    done=False,
                    position=idx,
                )
                db.add(sub)

        added_tasks.append(new_task)
        existing_titles.add(item.title.strip().lower())
        if item.source_id:
            existing_sources.add(source_key.lower())

    db.commit()
    for t in added_tasks:
        db.refresh(t)

    return AIIngestResponse(
        success=True,
        added_count=len(added_tasks),
        skipped_count=skipped_count,
        tasks=[TaskResponse.model_validate(t) for t in added_tasks],
        message=f"Ingested {len(added_tasks)} new tasks ({skipped_count} duplicates skipped).",
    )


@router.post("/extract-task", response_model=AIExtractResponse)
async def extract_task_from_text(
    payload: AIExtractRequest,
    db: Session = Depends(get_db),
    _auth=Depends(verify_integration_auth),
):
    """Direct text extraction endpoint: takes raw message/email text, uses Gemini to analyze it,
    and optionally saves any discovered action items directly to the database."""
    api_key = payload.api_key or settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="Gemini API key is not configured. Provide an api_key in the request or set GEMINI_API_KEY in the backend .env",
        )

    model = settings.GEMINI_MODEL or "gemini-2.5-flash"
    result = await call_gemini_extraction(
        content=payload.content,
        context=payload.context or "Email message",
        api_key=api_key,
        model=model,
    )

    has_actions = bool(result.get("has_action_items", False))
    raw_tasks = result.get("tasks", [])
    extracted: list[AIExtractedTask] = []

    for t in raw_tasks:
        try:
            extracted.append(
                AIExtractedTask(
                    title=t.get("title", "").strip(),
                    category=t.get("category", "Work"),
                    priority=t.get("priority", "Purr-fect"),
                    due_date=t.get("due_date"),
                    notes=t.get("notes", ""),
                    subtasks=t.get("subtasks", []) or [],
                    source=payload.source or "Gemini Scan",
                    source_id=payload.source_id,
                )
            )
        except Exception as e:
            logger.warning("Could not parse extracted task item: %s (%s)", t, e)

    saved_tasks: list[TaskResponse] = []
    if payload.auto_save and extracted:
        ingest_res = ingest_ai_tasks(
            AIIngestRequest(tasks=extracted),
            db=db,
        )
        saved_tasks = ingest_res.tasks

    summary_text = result.get("summary") or ("Found action items" if extracted else "No action items identified.")
    return AIExtractResponse(
        success=True,
        has_action_items=has_actions and len(extracted) > 0,
        summary=summary_text,
        extracted_tasks=extracted,
        saved_tasks=saved_tasks,
        message=f"Extracted {len(extracted)} tasks, saved {len(saved_tasks)} to database.",
    )


@router.get("/status", response_model=IntegrationStatusResponse)
def get_integration_status(
    request: Request,
    _auth=Depends(verify_integration_auth),
):
    """Returns the current webhook configuration status and integration key preview."""
    key = settings.effective_integration_key
    preview = f"{key[:4]}...{key[-4:]}" if len(key) >= 8 else "***"
    base_url = settings.DASHBOARD_PUBLIC_URL or str(request.base_url).rstrip("/")

    return IntegrationStatusResponse(
        integration_configured=bool(settings.effective_integration_key),
        gemini_configured=bool(settings.GEMINI_API_KEY),
        integration_key_preview=preview,
        gemini_model=settings.GEMINI_MODEL,
        webhook_url=f"{base_url}/api/integrations/ai-tasks",
    )


@router.get("/script")
def get_customized_apps_script(
    request: Request,
    _auth=Depends(verify_integration_auth),
):
    """Returns a customized, copy-paste ready Google Apps Script with dashboard URL and key."""
    base_url = settings.DASHBOARD_PUBLIC_URL or str(request.base_url).rstrip("/")
    key = settings.effective_integration_key

    script_template = f"""/**
 * =========================================================================
 * Lemon & Stain - Automated Inbox & Calendar Scanner (powered by Gemini)
 * =========================================================================
 * 
 * This script runs inside your Google Account to:
 * 1. Scan recent unread emails in your Gmail inbox for action items.
 * 2. Send the content to the Gemini API with structured instructions.
 * 3. Automatically create tasks in your Lemon & Stain dashboard!
 * 4. Label processed emails with 'LemonSynced' so they are never rescanned.
 *
 * HOW TO SET UP:
 * 1. Paste this script into https://script.google.com
 * 2. Fill in your GEMINI_API_KEY below (from Google AI Studio: https://aistudio.google.com)
 * 3. Select 'installTrigger' from the function dropdown at top and click 'Run'.
 * 4. Click 'Review Permissions' and grant access to Gmail and Calendar.
 * 5. You're done! It will now automatically scan your inbox every 15 minutes.
 */

const CONFIG = {{
  // Get your free key at https://aistudio.google.com/app/apikey
  GEMINI_API_KEY: '{settings.GEMINI_API_KEY or "YOUR_GEMINI_API_KEY_HERE"}',

  // Your Lemon & Stain Dashboard webhook URL
  WEBHOOK_URL: '{base_url}/api/integrations/ai-tasks',

  // Shared secret key for authenticating with your dashboard
  INTEGRATION_KEY: '{key}',

  // Gmail search query to locate new unread emails
  GMAIL_QUERY: 'is:unread -label:LemonSynced newer_than:2d',

  // Max threads to inspect in each scheduled run (keeps it fast & quota-friendly)
  MAX_THREADS: 10,

  // Label added to threads once analyzed
  PROCESSED_LABEL: 'LemonSynced',

  // Gemini model for extraction
  GEMINI_MODEL: '{settings.GEMINI_MODEL or "gemini-2.5-flash"}',

  // Also scan Google Calendar for upcoming events with action items?
  SCAN_CALENDAR: true,
  CALENDAR_DAYS_AHEAD: 3,
}};

/**
 * Run this function once to install the 15-minute automatic background trigger!
 */
function installTrigger() {{
  uninstallTrigger();
  ScriptApp.newTrigger('scanInboxAndCalendar')
    .timeBased()
    .everyMinutes(15)
    .create();
  Logger.log('Trigger installed! Running every 15 minutes.');
}}

/**
 * Run this to remove all background triggers if you ever want to pause.
 */
function uninstallTrigger() {{
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  Logger.log('All triggers removed.');
}}

/**
 * Main scheduled execution function.
 */
function scanInboxAndCalendar() {{
  if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY.includes('YOUR_GEMINI_API_KEY')) {{
    Logger.log('ERROR: Please set your GEMINI_API_KEY in the CONFIG section.');
    return;
  }}

  let processedLabel;
  try {{
    processedLabel = GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL) || GmailApp.createLabel(CONFIG.PROCESSED_LABEL);
  }} catch (e) {{
    Logger.log('Error creating/getting label: ' + e);
  }}

  // 1. Scan Gmail Threads
  const threads = GmailApp.search(CONFIG.GMAIL_QUERY, 0, CONFIG.MAX_THREADS);
  Logger.log(`Found ${{threads.length}} unread threads to inspect.`);

  for (const thread of threads) {{
    try {{
      const messages = thread.getMessages();
      const latestMsg = messages[messages.length - 1];
      const subject = thread.getFirstMessageSubject();
      const sender = latestMsg.getFrom();
      const date = latestMsg.getDate().toISOString();
      const plainBody = latestMsg.getPlainBody().substring(0, 8000); // Limit context size

      const emailContext = `Email from: ${{sender}}\\nSubject: ${{subject}}\\nDate: ${{date}}\\nThread ID: ${{thread.getId()}}`;
      
      const extraction = callGemini(plainBody, emailContext);
      if (extraction && extraction.has_action_items && extraction.tasks && extraction.tasks.length > 0) {{
        const tasksToIngest = extraction.tasks.map(t => ({{
          title: t.title,
          category: t.category || 'Work',
          priority: t.priority || 'Purr-fect',
          due_date: t.due_date || null,
          source: 'Gmail',
          source_id: 'gmail_' + thread.getId(),
          notes: (t.notes ? t.notes + '\\n\\n' : '') + `From: ${{sender}}\\nSubject: ${{subject}}`,
          subtasks: t.subtasks || []
        }}));

        sendTasksToDashboard(tasksToIngest);
      }}

      // Mark thread with label so it is not processed again
      if (processedLabel) {{
        thread.addLabel(processedLabel);
      }}
    }} catch (err) {{
      Logger.log(`Error processing thread ${{thread.getId()}}: ${{err}}`);
    }}
  }}

  // 2. Scan Google Calendar (Optional)
  if (CONFIG.SCAN_CALENDAR) {{
    scanCalendarEvents();
  }}
}}

/**
 * Scans upcoming calendar events with preparation or action notes.
 */
function scanCalendarEvents() {{
  try {{
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + CONFIG.CALENDAR_DAYS_AHEAD);

    const events = CalendarApp.getDefaultCalendar().getEvents(now, future);
    for (const event of events) {{
      const desc = event.getDescription();
      if (!desc || desc.length < 15) continue; // Skip events without meaningful notes

      // Skip already processed events (checked via tag in description)
      if (desc.includes('[LemonSynced]')) continue;

      const eventContext = `Calendar Event: ${{event.getTitle()}}\\nStarts: ${{event.getStartTime().toISOString()}}\\nLocation: ${{event.getLocation()}}`;
      const extraction = callGemini(desc, eventContext);

      if (extraction && extraction.has_action_items && extraction.tasks && extraction.tasks.length > 0) {{
        const tasksToIngest = extraction.tasks.map(t => ({{
          title: t.title,
          category: t.category || 'Grad School',
          priority: t.priority || 'Purr-fect',
          due_date: t.due_date || event.getStartTime().toISOString().split('T')[0],
          source: 'Google Calendar',
          source_id: 'cal_' + event.getId(),
          notes: (t.notes ? t.notes + '\\n\\n' : '') + `Event: ${{event.getTitle()}}\\nTime: ${{event.getStartTime().toLocaleString()}}`,
          subtasks: t.subtasks || []
        }}));

        sendTasksToDashboard(tasksToIngest);
        // Tag description to avoid duplicate scanning
        event.setDescription(desc + '\\n\\n[LemonSynced]');
      }}
    }}
  }} catch (e) {{
    Logger.log('Calendar scan error: ' + e);
  }}
}}

/**
 * Calls Gemini API with structured JSON output.
 */
function callGemini(content, context) {{
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${{CONFIG.GEMINI_MODEL}}:generateContent?key=${{CONFIG.GEMINI_API_KEY}}`;
  
  const prompt = `You are an executive assistant for a personal dashboard called Lemon & Stain.\\n` +
    `Determine if there are concrete action items or tasks required of the user.\\n\\n` +
    `Ignore marketing, automated notifications, newsletters, or general announcements unless explicit action is required.\\n` +
    `For each genuine task, extract: title, category ('Grad School'|'Work'|'Bills'|'Personal'), priority ('Zoomies'|'Purr-fect'|'Catnap'), due_date (YYYY-MM-DD or null), notes, and subtasks.\\n\\n` +
    `Context:\\n${{context}}\\n\\nContent:\\n${{content}}`;

  const payload = {{
    contents: [{{ parts: [{{ text: prompt }}] }}],
    generationConfig: {{
      responseMimeType: "application/json",
      responseSchema: {{
        type: "OBJECT",
        properties: {{
          has_action_items: {{ type: "BOOLEAN" }},
          summary: {{ type: "STRING" }},
          tasks: {{
            type: "ARRAY",
            items: {{
              type: "OBJECT",
              properties: {{
                title: {{ type: "STRING" }},
                category: {{ type: "STRING", enum: ["Grad School", "Work", "Bills", "Personal"] }},
                priority: {{ type: "STRING", enum: ["Zoomies", "Purr-fect", "Catnap"] }},
                due_date: {{ type: "STRING" }},
                notes: {{ type: "STRING" }},
                subtasks: {{ type: "ARRAY", items: {{ type: "STRING" }} }}
              }},
              required: ["title", "category", "priority"]
            }}
          }}
        }},
        required: ["has_action_items", "tasks"]
      }}
    }}
  }};

  const options = {{
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  }};

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {{
    Logger.log('Gemini error: ' + response.getContentText());
    return null;
  }}

  const resJson = JSON.parse(response.getContentText());
  try {{
    const textOut = resJson.candidates[0].content.parts[0].text;
    return JSON.parse(textOut);
  }} catch (e) {{
    Logger.log('JSON parse error: ' + e);
    return null;
  }}
}}

/**
 * Sends extracted tasks to Lemon & Stain webhook.
 */
function sendTasksToDashboard(tasks) {{
  const options = {{
    method: 'post',
    contentType: 'application/json',
    headers: {{
      'X-Integration-Key': CONFIG.INTEGRATION_KEY
    }},
    payload: JSON.stringify({{ tasks: tasks }}),
    muteHttpExceptions: true
  }};

  const res = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, options);
  Logger.log(`Dashboard response (${{res.getResponseCode()}}): ${{res.getContentText()}}`);
}}
"""
    return Response(content=script_template, media_type="application/javascript")
