from typing import List, Literal, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator

DATE_PATTERN = r"^\d{4}-\d{2}-\d{2}$"

Priority = Literal["Zoomies", "Purr-fect", "Catnap"]
TaskStatus = Literal["Pending", "In Progress", "Completed"]


def _blank_to_none(value):
    if isinstance(value, str) and not value.strip():
        return None
    return value


# --- Subtasks ---
class SubtaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class SubtaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    done: Optional[bool] = None
    position: Optional[int] = None


class SubtaskResponse(BaseModel):
    id: int
    task_id: int
    title: str
    done: bool
    position: int

    model_config = ConfigDict(from_attributes=True)


# --- Tasks ---
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category: str = Field(default="Grad School", max_length=100)
    priority: Priority = "Purr-fect"
    due_date: Optional[str] = Field(default=None, pattern=DATE_PATTERN)
    source: Optional[str] = Field(default="Manual", max_length=100)
    status: TaskStatus = "Pending"
    completed: bool = False
    notes: Optional[str] = Field(default="", max_length=20000)

    _blank_due = field_validator("due_date", mode="before")(_blank_to_none)


class TaskCreate(TaskBase):
    subtasks: List[str] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    category: Optional[str] = Field(default=None, max_length=100)
    priority: Optional[Priority] = None
    due_date: Optional[str] = Field(default=None, pattern=DATE_PATTERN)
    source: Optional[str] = Field(default=None, max_length=100)
    status: Optional[TaskStatus] = None
    completed: Optional[bool] = None
    notes: Optional[str] = Field(default=None, max_length=20000)
    position: Optional[int] = None

    _blank_due = field_validator("due_date", mode="before")(_blank_to_none)


class TaskResponse(BaseModel):
    id: int
    title: str
    category: str
    priority: str
    due_date: Optional[str] = None
    source: Optional[str] = None
    status: str
    completed: bool
    notes: Optional[str] = ""
    position: int = 0
    pomodoros: int = 0
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    subtasks: List[SubtaskResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ReorderRequest(BaseModel):
    ids: List[int]


# --- Events ---
class EventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    time: str = Field(default="All Day", max_length=100)
    date: str = Field(..., pattern=DATE_PATTERN)
    category: str = Field(default="Academic", max_length=100)
    icon: Optional[str] = Field(default=None, max_length=20)
    location: Optional[str] = Field(default="", max_length=255)


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    time: Optional[str] = Field(default=None, max_length=100)
    date: Optional[str] = Field(default=None, pattern=DATE_PATTERN)
    category: Optional[str] = Field(default=None, max_length=100)
    icon: Optional[str] = Field(default=None, max_length=20)
    location: Optional[str] = Field(default=None, max_length=255)


class EventResponse(BaseModel):
    id: int
    title: str
    time: str
    date: str
    category: str
    icon: Optional[str] = None
    location: Optional[str] = ""
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Habits ---
class HabitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    icon: Optional[str] = Field(default="🐾", max_length=20)


class HabitUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    icon: Optional[str] = Field(default=None, max_length=20)


class HabitResponse(BaseModel):
    id: int
    name: str
    icon: Optional[str] = "🐾"
    # Completed dates within the requested window, ascending
    checks: List[str]
    streak: int
    best_streak: int
    created_at: Optional[datetime] = None


# --- Focus sessions ---
class FocusSessionCreate(BaseModel):
    date: str = Field(..., pattern=DATE_PATTERN)
    minutes: int = Field(..., ge=1, le=240)
    task_id: Optional[int] = None


class FocusSessionResponse(BaseModel):
    id: int
    date: str
    minutes: int
    task_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Bookmarks ---
class BookmarkBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    url: str = Field(..., min_length=1, max_length=500)
    category: str = Field(default="General", max_length=100)
    icon: Optional[str] = Field(default="🔗", max_length=20)

    @field_validator("url")
    @classmethod
    def _http_only(cls, value: str) -> str:
        value = value.strip()
        if not value.lower().startswith(("http://", "https://")):
            value = "https://" + value
        return value


class BookmarkCreate(BookmarkBase):
    pass


class BookmarkResponse(BaseModel):
    id: int
    title: str
    url: str
    category: str
    icon: Optional[str] = "🔗"
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
    content: str = Field(..., max_length=200000)


class NoteResponse(BaseModel):
    id: str
    content: str
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Assignments ---
AssignmentStatus = Literal["Not Started", "In Progress", "Completed"]


class AssignmentBase(BaseModel):
    course: str = Field(..., min_length=1, max_length=150)
    prof: Optional[str] = Field(default="", max_length=150)
    name: str = Field(..., min_length=1, max_length=255)
    due: Optional[str] = Field(default="", max_length=100)
    weight: Optional[str] = Field(default="", max_length=50)
    status: AssignmentStatus = "Not Started"


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    course: Optional[str] = Field(default=None, min_length=1, max_length=150)
    prof: Optional[str] = Field(default=None, max_length=150)
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    due: Optional[str] = Field(default=None, max_length=100)
    weight: Optional[str] = Field(default=None, max_length=50)
    status: Optional[AssignmentStatus] = None


class AssignmentResponse(BaseModel):
    id: int
    course: str
    prof: Optional[str] = ""
    name: str
    due: Optional[str] = ""
    weight: Optional[str] = ""
    status: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Auth ---
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1, max_length=512)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=512)
    new_password: str = Field(..., min_length=10, max_length=512)


class ProfileUpdate(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=100)


class UserResponse(BaseModel):
    username: str
    display_name: str


class AuthStatusResponse(BaseModel):
    authenticated: bool
    account_exists: bool
    user: Optional[UserResponse] = None


# --- Sync & Health ---
class SyncRequest(BaseModel):
    sheet_url: Optional[str] = Field(default=None, max_length=2000)


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
