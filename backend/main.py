import logging
import time
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from config import settings
from database.connection import engine, init_db
from models.schemas import HealthResponse
from routes import (
    tasks_router,
    events_router,
    habits_router,
    bookmarks_router,
    counters_router,
    notes_router,
    sync_router,
    focus_router,
    auth_router,
)
from security import require_user

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

APP_VERSION = "2.0.0"
start_time = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables, apply migrations, seed a fresh database, ensure an account exists
    init_db()
    yield

app = FastAPI(
    title="Lemon & Stain Personal Dashboard API",
    description="REST API for the Lemon & Stain study dashboard",
    version=APP_VERSION,
    lifespan=lifespan,
    # Interactive docs list every endpoint, so they're only served in development
    docs_url="/docs" if settings.is_dev else None,
    redoc_url="/redoc" if settings.is_dev else None,
    openapi_url="/openapi.json" if settings.is_dev else None,
)

# CORS is only needed for the Vite dev server; production is same-origin behind Caddy
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip() and origin.strip() != "*"]
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Content-Type", "X-Requested-With"],
    )

# Public routes
app.include_router(auth_router)

# Everything else requires a signed-in session
protected = [Depends(require_user)]
for router in (
    tasks_router,
    events_router,
    habits_router,
    bookmarks_router,
    counters_router,
    notes_router,
    sync_router,
    focus_router,
):
    app.include_router(router, dependencies=protected)


@app.get("/api/health", response_model=HealthResponse, tags=["System"])
def health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_state = "connected"
    except Exception:
        db_state = "unavailable"
    return HealthResponse(
        status="healthy" if db_state == "connected" else "degraded",
        version=APP_VERSION,
        environment=settings.APP_ENV,
        database=db_state,
        uptime_seconds=round(time.time() - start_time, 2)
    )
