import csv
import io
import re
from datetime import datetime
from typing import Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from config import settings
from database.connection import get_db
from models.db_models import Task
from models.schemas import SyncRequest, SyncResponse

router = APIRouter(prefix="/api/sync", tags=["Sync & Export"])

def _parse_and_sync_csv(csv_content: str, db: Session) -> int:
    reader = csv.reader(io.StringIO(csv_content))
    rows = list(reader)
    
    # Locate header row containing 'Task Title'
    header_idx = -1
    for idx, row in enumerate(rows):
        if any(cell.strip().lower() == 'task title' for cell in row):
            header_idx = idx
            break
            
    if header_idx == -1:
        raise HTTPException(
            status_code=400,
            detail="Header row not found. Please ensure the CSV contains a 'Task Title' column header."
        )
        
    headers = [cell.strip().lower() for cell in rows[header_idx]]
    
    def get_col(name: str):
        return headers.index(name) if name in headers else -1

    title_col = get_col('task title')
    cat_col = get_col('category')
    prio_col = get_col('priority')
    due_col = get_col('due date')
    src_col = get_col('source')
    status_col = get_col('status')
    notes_col = get_col('notes')

    existing_tasks = db.query(Task).all()
    tasks_by_title = {t.title.strip().lower(): t for t in existing_tasks}
    
    synced_count = 0

    for i in range(header_idx + 1, len(rows)):
        row = rows[i]
        if not row:
            continue
            
        title = row[title_col].strip() if title_col != -1 and title_col < len(row) else ""
        if not title:
            continue

        category = row[cat_col].strip() if cat_col != -1 and cat_col < len(row) and row[cat_col].strip() else "Grad School"
        priority_raw = row[prio_col].strip() if prio_col != -1 and prio_col < len(row) else "Purr-fect"
        
        priority = "Purr-fect"
        if re.search(r"zoomies|high", priority_raw, re.I):
            priority = "Zoomies"
        elif re.search(r"catnap|low", priority_raw, re.I):
            priority = "Catnap"

        due = row[due_col].strip() if due_col != -1 and due_col < len(row) and row[due_col].strip() else "2026-09-04"
        source = row[src_col].strip() if src_col != -1 and src_col < len(row) and row[src_col].strip() else "Master Sheet"
        status_val = row[status_col].strip() if status_col != -1 and status_col < len(row) and row[status_col].strip() else "Pending"
        notes = row[notes_col].strip() if notes_col != -1 and notes_col < len(row) else ""

        lookup_key = title.lower()
        if lookup_key in tasks_by_title:
            # Update existing task while preserving local completion if completed locally
            existing = tasks_by_title[lookup_key]
            existing.category = category
            existing.priority = priority
            existing.due_date = due
            existing.source = source
            if notes:
                existing.notes = notes
            # If sheet says Completed, mark complete
            if status_val.lower() == "completed":
                existing.completed = True
                existing.status = "Completed"
        else:
            is_completed = (status_val.lower() == "completed")
            new_task = Task(
                title=title,
                category=category,
                priority=priority,
                due_date=due,
                source=source,
                status="Completed" if is_completed else "Pending",
                completed=is_completed,
                notes=notes
            )
            db.add(new_task)
            tasks_by_title[lookup_key] = new_task
            
        synced_count += 1

    db.commit()
    return synced_count

@router.post("/sheet", response_model=SyncResponse)
async def sync_from_google_sheet(
    payload: Optional[SyncRequest] = None,
    db: Session = Depends(get_db)
):
    url = (payload and payload.sheet_url) or settings.DEFAULT_SHEET_URL
    if not url:
        raise HTTPException(status_code=400, detail="No Google Sheet CSV URL provided or configured")

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"Failed to fetch Google Sheet CSV: HTTP {resp.status_code}"
                )
            csv_content = resp.text
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Network error while connecting to Google Sheet: {str(e)}"
        )

    count = _parse_and_sync_csv(csv_content, db)
    now_str = datetime.now().strftime("%I:%M %p")
    return SyncResponse(
        success=True,
        message=f"Successfully synchronized {count} tasks from Google Sheet.",
        tasks_synced=count,
        last_sync_time=now_str
    )

@router.post("/upload-csv", response_model=SyncResponse)
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    content = await file.read()
    csv_text = content.decode("utf-8", errors="replace")
    count = _parse_and_sync_csv(csv_text, db)
    now_str = datetime.now().strftime("%I:%M %p")
    return SyncResponse(
        success=True,
        message=f"Imported {count} tasks from uploaded CSV file.",
        tasks_synced=count,
        last_sync_time=now_str
    )

@router.get("/export-csv")
def export_tasks_csv(db: Session = Depends(get_db)):
    tasks = db.query(Task).order_by(Task.due_date.asc(), Task.id.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Standard headers matching Master Task Tracker format
    writer.writerow(["Task Title", "Category", "Priority", "Due Date", "Source", "Status", "Notes"])

    for t in tasks:
        writer.writerow([
            t.title,
            t.category,
            t.priority,
            t.due_date or "",
            t.source or "",
            "Completed" if t.completed else "Pending",
            t.notes or ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=tasks_master_export.csv",
            "Cache-Control": "no-cache"
        }
    )
