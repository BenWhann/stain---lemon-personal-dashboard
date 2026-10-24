import json
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, Text, DateTime, ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from database.connection import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="Grad School")
    priority = Column(String(50), default="Purr-fect")  # Zoomies, Purr-fect, Catnap
    due_date = Column(String(50), nullable=True)        # YYYY-MM-DD
    source = Column(String(100), default="Manual")
    status = Column(String(50), default="Pending")      # Pending, In Progress, Completed
    completed = Column(Boolean, default=False)
    notes = Column(Text, default="")
    position = Column(Integer, default=0)
    pomodoros = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    subtasks = relationship(
        "Subtask",
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="Subtask.position",
        lazy="selectin",
    )


class Subtask(Base):
    __tablename__ = "subtasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    done = Column(Boolean, default=False)
    position = Column(Integer, default=0)

    task = relationship("Task", back_populates="subtasks")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    time = Column(String(100), default="All Day")
    date = Column(String(50), nullable=False)           # YYYY-MM-DD
    category = Column(String(100), default="Academic")  # Academic, Work, Bills, Wellness, Personal
    icon = Column(String(20), default="📅")
    location = Column(String(255), default="")
    created_at = Column(DateTime, default=utcnow)


class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    icon = Column(String(20), default="🐾")
    # Legacy weekly toggle array (Mon..Sun). Kept so old databases migrate cleanly;
    # completions now live in habit_checks as real dates.
    days_json = Column(Text, default="[false, false, false, false, false, false, false]")
    streak = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)

    checks = relationship(
        "HabitCheck",
        back_populates="habit",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    @property
    def legacy_days(self):
        try:
            return json.loads(self.days_json)
        except Exception:
            return [False] * 7


class HabitCheck(Base):
    __tablename__ = "habit_checks"
    __table_args__ = (UniqueConstraint("habit_id", "date", name="uq_habit_check_day"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String(10), nullable=False)  # YYYY-MM-DD, in the user's local calendar

    habit = relationship("Habit", back_populates="checks")


class FocusSession(Base):
    __tablename__ = "focus_sessions"
    __table_args__ = (Index("ix_focus_sessions_date", "date"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(10), nullable=False)  # local YYYY-MM-DD
    minutes = Column(Integer, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=utcnow)


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    category = Column(String(100), default="General")
    icon = Column(String(20), default="🔗")
    created_at = Column(DateTime, default=utcnow)


class Counter(Base):
    __tablename__ = "counters"

    name = Column(String(100), primary_key=True, index=True)
    count = Column(Integer, default=0)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


class Note(Base):
    __tablename__ = "notes"

    id = Column(String(100), primary_key=True, index=True)
    content = Column(Text, default="")
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    course = Column(String(150), nullable=False)
    prof = Column(String(150), default="")
    name = Column(String(255), nullable=False)
    due = Column(String(100), default="")
    weight = Column(String(50), default="")
    status = Column(String(50), default="Not Started")
    created_at = Column(DateTime, default=utcnow)


class Meta(Base):
    __tablename__ = "meta"

    key = Column(String(100), primary_key=True)
    value = Column(Text, default="")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), default="")
    created_at = Column(DateTime, default=utcnow)
    password_changed_at = Column(DateTime, default=utcnow)


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    # sha256 of the cookie token; the raw token is never stored
    id = Column(String(64), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow)
    expires_at = Column(DateTime, nullable=False)
    last_seen_at = Column(DateTime, default=utcnow)
    user_agent = Column(String(255), default="")
