from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# --- Tasks ---
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category: str = Field(default="Grad School")
    priority: str = Field(default="Purr-fect")  # Zoomies, Purr-fect, Catnap
    due_date: Optional[str] = Field(default="2026-09-04")
    source: Optional[str] = Field(default="Manual")
    status: Optional[str] = Field(default="Pending")
    completed: bool = Field(default=False)
    notes: Optional[str] = Field(default="")

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    completed: Optional[bool] = None
    notes: Optional[str] = None

class TaskResponse(TaskBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Events ---
class EventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    time: str = Field(default="All Day")
    date: str = Field(...)  # YYYY-MM-DD
    category: str = Field(default="Academic")
    icon: Optional[str] = Field(default="📅")
    location: Optional[str] = Field(default="")

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    time: Optional[str] = None
    date: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    location: Optional[str] = None

class EventResponse(EventBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Habits ---
class HabitBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    icon: Optional[str] = Field(default="🐾")

class HabitCreate(HabitBase):
    days: Optional[List[bool]] = Field(default_factory=lambda: [False] * 7)

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    days: Optional[List[bool]] = None
    streak: Optional[int] = None

class HabitResponse(HabitBase):
    id: int
    days: List[bool]
    streak: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Bookmarks ---
class BookmarkBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    url: str = Field(...)
    category: str = Field(default="General")
    icon: Optional[str] = Field(default="🔗")

class BookmarkCreate(BookmarkBase):
    pass

class BookmarkResponse(BookmarkBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Counters ---
class CounterResponse(BaseModel):
    lemon_pets: int
    stain_pets: int
    focus_paws: int

class CounterIncrementResponse(BaseModel):
    name: str
    count: int

# --- Notes ---
class NoteUpdate(BaseModel):
    content: str

class NoteResponse(BaseModel):
    id: str
    content: str
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Assignments ---
class AssignmentBase(BaseModel):
    course: str
    prof: Optional[str] = ""
    name: str
    due: Optional[str] = ""
    weight: Optional[str] = ""
    status: Optional[str] = "Not Started"

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentResponse(AssignmentBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Sync & Health ---
class SyncRequest(BaseModel):
    sheet_url: Optional[str] = None

class SyncResponse(BaseModel):
    success: bool
    message: str
    tasks_synced: int
    last_sync_time: str

class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    database: str
    uptime_seconds: float
