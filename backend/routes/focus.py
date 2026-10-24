from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from database.connection import get_db
from models.db_models import Counter, FocusSession, Task
from models.schemas import DATE_PATTERN, FocusSessionCreate, FocusSessionResponse

router = APIRouter(prefix="/api/focus", tags=["Focus"])


@router.get("/sessions", response_model=List[FocusSessionResponse])
def list_sessions(
    since: Optional[str] = Query(None, pattern=DATE_PATTERN, description="Earliest local date to include"),
    db: Session = Depends(get_db),
):
    query = db.query(FocusSession)
    if since:
        query = query.filter(FocusSession.date >= since)
    return query.order_by(FocusSession.date.asc(), FocusSession.id.asc()).all()


@router.post("/sessions", response_model=FocusSessionResponse, status_code=status.HTTP_201_CREATED)
def log_session(payload: FocusSessionCreate, db: Session = Depends(get_db)):
    """Record a finished focus sprint, credit its task, and award a focus paw."""
    task_id = payload.task_id
    if task_id is not None:
        task = db.get(Task, task_id)
        if task:
            task.pomodoros = (task.pomodoros or 0) + 1
        else:
            task_id = None

    session = FocusSession(date=payload.date, minutes=payload.minutes, task_id=task_id)
    db.add(session)

    paws = db.get(Counter, "focus_paws")
    if paws:
        paws.count += 1
    else:
        db.add(Counter(name="focus_paws", count=1))

    db.commit()
    db.refresh(session)
    return session
