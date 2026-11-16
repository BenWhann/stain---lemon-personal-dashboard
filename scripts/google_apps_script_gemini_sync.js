/**
 * =========================================================================
 * Lemon & Stain - Automated Inbox & Calendar Scanner (powered by Gemini)
 * =========================================================================
 * 
 * This script runs inside your Google Account (via script.google.com) to:
 * 1. Scan recent unread emails in Gmail for concrete action items.
 * 2. Send the content to the Gemini API with structured instructions.
 * 3. Automatically create tasks in your Lemon & Stain dashboard!
 * 4. Label processed emails with 'LemonSynced' so they are never rescanned.
 *
 * HOW TO SET UP:
 * 1. Go to https://script.google.com and click "New project".
 * 2. Paste this entire script into the editor (replace Code.gs content).
 * 3. Set your GEMINI_API_KEY, DASHBOARD_URL, and INTEGRATION_KEY in CONFIG below.
 * 4. From the function dropdown at top, select "installTrigger" and click "Run".
 * 5. Google will ask for permission to read Gmail/Calendar. Click "Review permissions" -> "Allow".
 * 6. You are all set! The scanner will run automatically in the background every 15 minutes.
 */

const CONFIG = {
  // Get your free Gemini API key at https://aistudio.google.com/app/apikey
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',

  // Your Lemon & Stain Dashboard URL (e.g. 'https://lemon.yourdomain.com' or tunnel)
  DASHBOARD_URL: 'https://YOUR_DASHBOARD_URL',

  // The secret integration key configured in your dashboard Settings or backend .env
  INTEGRATION_KEY: 'YOUR_INTEGRATION_KEY_HERE',

  // Search query for incoming unread emails
  GMAIL_QUERY: 'is:unread -label:LemonSynced newer_than:2d',

  // Max threads to inspect per scheduled run
  MAX_THREADS: 10,

  // Label added to threads in Gmail once processed
  PROCESSED_LABEL: 'LemonSynced',

  // Gemini model
  GEMINI_MODEL: 'gemini-2.5-flash',

  // Set to true to also scan upcoming Google Calendar events for prep tasks
  SCAN_CALENDAR: true,
  CALENDAR_DAYS_AHEAD: 3,
};

/**
 * Run this function once to install the automatic 15-minute background trigger!
 */
function installTrigger() {
  uninstallTrigger();
  ScriptApp.newTrigger('scanInboxAndCalendar')
    .timeBased()
    .everyMinutes(15)
    .create();
  Logger.log('Trigger installed! Running every 15 minutes.');
}

/**
 * Run this to remove all background triggers if you ever want to pause scanning.
 */
function uninstallTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  Logger.log('All triggers removed.');
}

/**
 * Main scheduled execution function.
 */
function scanInboxAndCalendar() {
  if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY.includes('YOUR_GEMINI_API_KEY')) {
    Logger.log('ERROR: Please set your GEMINI_API_KEY in the CONFIG section.');
    return;
  }

  let processedLabel;
  try {
    processedLabel = GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL) || GmailApp.createLabel(CONFIG.PROCESSED_LABEL);
  } catch (e) {
    Logger.log('Label info: ' + e);
  }

  // 1. Scan Gmail Threads
  const threads = GmailApp.search(CONFIG.GMAIL_QUERY, 0, CONFIG.MAX_THREADS);
  Logger.log(`Found ${threads.length} unread threads to inspect.`);

  for (const thread of threads) {
    try {
      const messages = thread.getMessages();
      const latestMsg = messages[messages.length - 1];
      const subject = thread.getFirstMessageSubject();
      const sender = latestMsg.getFrom();
      const date = latestMsg.getDate().toISOString();
      const plainBody = latestMsg.getPlainBody().substring(0, 8000);

      const emailContext = `Email from: ${sender}\nSubject: ${subject}\nDate: ${date}\nThread ID: ${thread.getId()}`;
      
      const extraction = callGemini(plainBody, emailContext);
      if (extraction && extraction.has_action_items && extraction.tasks && extraction.tasks.length > 0) {
        const tasksToIngest = extraction.tasks.map(t => ({
          title: t.title,
          category: t.category || 'Work',
          priority: t.priority || 'Purr-fect',
          due_date: t.due_date || null,
          source: 'Gmail',
          source_id: 'gmail_' + thread.getId(),
          notes: (t.notes ? t.notes + '\n\n' : '') + `From: ${sender}\nSubject: ${subject}`,
          subtasks: t.subtasks || []
        }));

        sendTasksToDashboard(tasksToIngest);
      }

      // Mark thread with label so it is not scanned again
      if (processedLabel) {
        thread.addLabel(processedLabel);
      }
    } catch (err) {
      Logger.log(`Error processing thread ${thread.getId()}: ${err}`);
    }
  }

  // 2. Scan Google Calendar (Optional)
  if (CONFIG.SCAN_CALENDAR) {
    scanCalendarEvents();
  }
}

/**
 * Scans upcoming calendar events with preparation or action notes.
 */
function scanCalendarEvents() {
  try {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + CONFIG.CALENDAR_DAYS_AHEAD);

    const events = CalendarApp.getDefaultCalendar().getEvents(now, future);
    for (const event of events) {
      const desc = event.getDescription();
      if (!desc || desc.length < 15) continue; // Skip events without meaningful notes

      if (desc.includes('[LemonSynced]')) continue;

      const eventContext = `Calendar Event: ${event.getTitle()}\nStarts: ${event.getStartTime().toISOString()}\nLocation: ${event.getLocation()}`;
      const extraction = callGemini(desc, eventContext);

      if (extraction && extraction.has_action_items && extraction.tasks && extraction.tasks.length > 0) {
        const tasksToIngest = extraction.tasks.map(t => ({
          title: t.title,
          category: t.category || 'Grad School',
          priority: t.priority || 'Purr-fect',
          due_date: t.due_date || event.getStartTime().toISOString().split('T')[0],
          source: 'Google Calendar',
          source_id: 'cal_' + event.getId(),
          notes: (t.notes ? t.notes + '\n\n' : '') + `Event: ${event.getTitle()}\nTime: ${event.getStartTime().toLocaleString()}`,
          subtasks: t.subtasks || []
        }));

        sendTasksToDashboard(tasksToIngest);
        event.setDescription(desc + '\n\n[LemonSynced]');
      }
    }
  } catch (e) {
    Logger.log('Calendar scan error: ' + e);
  }
}

/**
 * Calls Gemini API with structured JSON output.
 */
function callGemini(content, context) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
  
  const prompt = `You are an executive assistant for a personal dashboard called Lemon & Stain.\n` +
    `Determine if there are concrete action items or tasks required of the user.\n\n` +
    `Ignore marketing, automated notifications, newsletters, or general announcements unless explicit action is required.\n` +
    `For each genuine task, extract: title, category ('Grad School'|'Work'|'Bills'|'Personal'), priority ('Zoomies'|'Purr-fect'|'Catnap'), due_date (YYYY-MM-DD or null), notes, and subtasks.\n\n` +
    `Context:\n${context}\n\nContent:\n${content}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          has_action_items: { type: "BOOLEAN" },
          summary: { type: "STRING" },
          tasks: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                category: { type: "STRING", enum: ["Grad School", "Work", "Bills", "Personal"] },
                priority: { type: "STRING", enum: ["Zoomies", "Purr-fect", "Catnap"] },
                due_date: { type: "STRING" },
                notes: { type: "STRING" },
                subtasks: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["title", "category", "priority"]
            }
          }
        },
        required: ["has_action_items", "tasks"]
      }
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    Logger.log('Gemini error: ' + response.getContentText());
    return null;
  }

  const resJson = JSON.parse(response.getContentText());
  try {
    const textOut = resJson.candidates[0].content.parts[0].text;
    return JSON.parse(textOut);
  } catch (e) {
    Logger.log('JSON parse error: ' + e);
    return null;
  }
}

/**
 * Sends extracted tasks to Lemon & Stain webhook.
 */
function sendTasksToDashboard(tasks) {
  const webhookUrl = CONFIG.DASHBOARD_URL.replace(/\/$/, '') + '/api/integrations/ai-tasks';
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'X-Integration-Key': CONFIG.INTEGRATION_KEY
    },
    payload: JSON.stringify({ tasks: tasks }),
    muteHttpExceptions: true
  };

  const res = UrlFetchApp.fetch(webhookUrl, options);
  Logger.log(`Dashboard response (${res.getResponseCode()}): ${res.getContentText()}`);
}
