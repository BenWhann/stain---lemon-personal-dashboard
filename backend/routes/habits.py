from datetime import date, timedelta
from typing import Iterable, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session
from database.connection import get_db
from models.db_models import Habit, HabitCheck
from models.schemas import DATE_PATTERN, HabitCreate, HabitResponse, HabitUpdate

router = APIRouter(prefix="/api/habits", tags=["Habits"])

# How much history the client gets back with each habit (heatmaps use up to 12 weeks)
HISTORY_DAYS = 84


def _parse_day(value: Optional[str]) -> date:
    if not value:
        return date.today()
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise HTTPException(status_code=422, detail="Dates must be YYYY-MM-DD")


def current_streak(days: Iterable[str], today: date) -> int:
    """Consecutive checked days ending today, or ending yesterday when today is still open."""
    done = set(days)
    cursor = today if today.isoformat() in done else today - timedelta(days=1)
    streak = 0
    while cursor.isoformat() in done:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def best_streak(days: Iterable[str]) -> int:
    ordered = sorted({date.fromisoformat(d) for d in days})
    best = run = 0
    prev = None
    for d in ordered:
        run = run + 1 if prev and d - prev == timedelta(days=1) else 1
        best = max(best, run)
        prev = d
    return best


def _format(habit: Habit, today: date) -> HabitResponse:
    all_days = [c.date for c in habit.checks]
    window_start = (today - timedelta(days=HISTORY_DAYS - 1)).isoformat()
    recent = sorted(d for d in all_days if window_start <= d <= today.isoformat())
    return HabitResponse(
        id=habit.id,
        name=habit.name,
        icon=habit.icon,
        checks=recent,
        streak=current_streak(all_days, today),
        best_streak=best_streak(all_days),
        created_at=habit.created_at,
    )


@router.get("", response_model=List[HabitResponse])
def get_habits(today: Optional[str] = Query(None, pattern=DATE_PATTERN), db: Session = Depends(get_db)):
    day = _parse_day(today)
    habits = db.query(Habit).order_by(Habit.id.asc()).all()
    return [_format(h, day) for h in habits]


@router.post("", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
def create_habit(
    habit_in: HabitCreate,
    today: Optional[str] = Query(None, pattern=DATE_PATTERN),
    db: Session = Depends(get_db),
):
    habit = Habit(name=habit_in.name.strip(), icon=habit_in.icon or "🐾")
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return _format(habit, _parse_day(today))


@router.put("/{habit_id}/checks/{day}", response_model=HabitResponse)
def set_habit_check(
    habit_id: int,
    day: str = Path(..., pattern=DATE_PATTERN),
    done: bool = Query(True),
    today: Optional[str] = Query(None, pattern=DATE_PATTERN),
    db: Session = Depends(get_db),
):
    """Idempotently mark (done=true) or unmark (done=false) a habit for a calendar day."""
    habit = db.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    check_day = _parse_day(day)
    ref_today = _parse_day(today)
    if check_day > ref_today:
        raise HTTPException(status_code=400, detail="Can't check off a day that hasn't happened yet")

    existing = next((c for c in habit.checks if c.date == check_day.isoformat()), None)
    if done and not existing:
        habit.checks.append(HabitCheck(date=check_day.isoformat()))
    elif not done and existing:
        habit.checks.remove(existing)
    habit.streak = current_streak([c.date for c in habit.checks], ref_today)
    db.commit()
    db.refresh(habit)
    return _format(habit, ref_today)


@router.put("/{habit_id}", response_model=HabitResponse)
def update_habit(
    habit_id: int,
    habit_in: HabitUpdate,
    today: Optional[str] = Query(None, pattern=DATE_PATTERN),
    db: Session = Depends(get_db),
):
    habit = db.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    for key, value in habit_in.model_dump(exclude_unset=True).items():
        setattr(habit, key, value)
    db.commit()
    db.refresh(habit)
    return _format(habit, _parse_day(today))


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = db.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    db.delete(habit)
    db.commit()
    return None
