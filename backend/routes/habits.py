import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import get_db
from models.db_models import Habit
from models.schemas import HabitCreate, HabitUpdate, HabitResponse

router = APIRouter(prefix="/api/habits", tags=["Habits"])

def _format_habit(h: Habit) -> dict:
    return {
        "id": h.id,
        "name": h.name,
        "icon": h.icon,
        "days": h.days,
        "streak": h.streak,
        "created_at": h.created_at
    }

@router.get("", response_model=List[HabitResponse])
def get_habits(db: Session = Depends(get_db)):
    habits = db.query(Habit).order_by(Habit.id.asc()).all()
    return [_format_habit(h) for h in habits]

@router.post("", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
def create_habit(habit_in: HabitCreate, db: Session = Depends(get_db)):
    days_list = habit_in.days if habit_in.days and len(habit_in.days) == 7 else [False] * 7
    streak = sum(1 for d in days_list if d)
    
    habit = Habit(
        name=habit_in.name,
        icon=habit_in.icon or "🐾",
        days_json=json.dumps(days_list),
        streak=streak
    )
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return _format_habit(habit)

@router.put("/{habit_id}/toggle/{day_index}", response_model=HabitResponse)
def toggle_habit_day(habit_id: int, day_index: int, db: Session = Depends(get_db)):
    if not (0 <= day_index <= 6):
        raise HTTPException(status_code=400, detail="day_index must be between 0 and 6")
        
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
        
    current_days = habit.days
    current_days[day_index] = not current_days[day_index]
    habit.days = current_days
    # Dynamic streak calculation: count consecutive completed days backwards or total active
    habit.streak = sum(1 for d in current_days if d)
    
    db.commit()
    db.refresh(habit)
    return _format_habit(habit)

@router.put("/{habit_id}", response_model=HabitResponse)
def update_habit(habit_id: int, habit_in: HabitUpdate, db: Session = Depends(get_db)):
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
        
    if habit_in.name is not None:
        habit.name = habit_in.name
    if habit_in.icon is not None:
        habit.icon = habit_in.icon
    if habit_in.days is not None and len(habit_in.days) == 7:
        habit.days = habit_in.days
        habit.streak = sum(1 for d in habit_in.days if d)
    elif habit_in.streak is not None:
        habit.streak = habit_in.streak
        
    db.commit()
    db.refresh(habit)
    return _format_habit(habit)

@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = db.query(Habit).filter(Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    db.delete(habit)
    db.commit()
    return None
