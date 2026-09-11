from .tasks import router as tasks_router
from .events import router as events_router
from .habits import router as habits_router
from .bookmarks import router as bookmarks_router
from .counters import router as counters_router
from .notes import router as notes_router
from .sync import router as sync_router

__all__ = [
    "tasks_router",
    "events_router",
    "habits_router",
    "bookmarks_router",
    "counters_router",
    "notes_router",
    "sync_router"
]
