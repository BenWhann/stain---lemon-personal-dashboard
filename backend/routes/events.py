from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database.connection import get_db
from models.db_models import Event
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

    event = Event(
        title=event_in.title,
        time=event_in.time,
        date=event_in.date,
        category=event_in.category,
        icon=icon,
        location=event_in.location or ""
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
