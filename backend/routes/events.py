from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database.connection import get_db
from models.db_models import Event, Task
from models.schemas import EventCreate, EventUpdate, EventResponse

router = APIRouter(prefix="/api/events", tags=["Events"])

@router.get("", response_model=List[EventResponse])
def get_events(
    date: Optional[str] = Query(None, description="Exact date in YYYY-MM-DD"),
    month: Optional[str] = Query(None, description="Month prefix in YYYY-MM"),
    category: Optional[str] = Query(None, description="Category filter (Academic, Work, Bills, Wellness, Personal)"),
    db: Session = Depends(get_db)
):
    query = db.query(Event)
    
    if date:
        query = query.filter(Event.date == date)
    elif month:
        query = query.filter(Event.date.startswith(month))
        
    if category and category != "All":
        query = query.filter(Event.category == category)
        
    return query.order_by(Event.date.asc(), Event.time.asc()).all()

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(event_in: EventCreate, db: Session = Depends(get_db)):
    icon = event_in.icon
    if not icon:
        icon_map = {
            "Academic": "🎓",
            "Work": "💼",
            "Bills": "💳",
            "Wellness": "🧘‍♀️",
            "Personal": "🐾"
        }
        icon = icon_map.get(event_in.category, "📅")

    task_id = event_in.task_id

    # If task_id was provided, ensure it exists
    if task_id is not None:
        existing_task = db.query(Task).filter(Task.id == task_id).first()
        if not existing_task:
            task_id = None

    # Every calendar event must link to a task: auto-create if not explicitly linked
    if task_id is None:
        cat_map = {
            "Academic": "Grad School",
            "Work": "Work",
            "Bills": "Bills",
            "Wellness": "Personal",
            "Personal": "Personal",
        }
        task_cat = cat_map.get(event_in.category, "Personal")
        new_task = Task(
            title=event_in.title,
            category=task_cat,
            priority="Purr-fect",
            due_date=event_in.date,
            source="Calendar",
            status="Pending",
            completed=False,
            notes=f"Linked to calendar event ({event_in.time})" if event_in.time else "Linked to calendar event",
        )
        db.add(new_task)
        db.flush()
        task_id = new_task.id

    event = Event(
        title=event_in.title,
        time=event_in.time,
        date=event_in.date,
        category=event_in.category,
        icon=icon,
        location=event_in.location or "",
        task_id=task_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.put("/{event_id}", response_model=EventResponse)
def update_event(event_id: int, event_in: EventUpdate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    update_data = event_in.model_dump(exclude_unset=True)
    if "task_id" in update_data and update_data["task_id"] is not None:
        task = db.query(Task).filter(Task.id == update_data["task_id"]).first()
        if not task:
            raise HTTPException(status_code=400, detail="Linked task not found")
            
    for key, value in update_data.items():
        setattr(event, key, value)
        
    db.commit()
    db.refresh(event)
    return event

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return None
