import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from database.connection import Base

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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    time = Column(String(100), default="All Day")
    date = Column(String(50), nullable=False)           # YYYY-MM-DD
    category = Column(String(100), default="Academic")  # Academic, Work, Bills, Wellness, Personal
    icon = Column(String(20), default="📅")
    location = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    icon = Column(String(20), default="🐾")
    # Store days array as JSON string (e.g. "[true, true, false, ...]")
    days_json = Column(Text, default="[false, false, false, false, false, false, false]")
    streak = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def days(self):
        try:
            return json.loads(self.days_json)
        except Exception:
            return [False] * 7

    @days.setter
    def days(self, val):
        self.days_json = json.dumps(val)

class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    category = Column(String(100), default="General")
    icon = Column(String(20), default="🔗")
    created_at = Column(DateTime, default=datetime.utcnow)

class Counter(Base):
    __tablename__ = "counters"

    name = Column(String(100), primary_key=True, index=True)
    count = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Note(Base):
    __tablename__ = "notes"

    id = Column(String(100), primary_key=True, index=True)
    content = Column(Text, default="")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    course = Column(String(150), nullable=False)
    prof = Column(String(150), default="")
    name = Column(String(255), nullable=False)
    due = Column(String(100), default="")
    weight = Column(String(50), default="")
    status = Column(String(50), default="Not Started")
    created_at = Column(DateTime, default=datetime.utcnow)
