import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database.connection import init_db
from models.schemas import HealthResponse
from routes import (
    tasks_router,
    events_router,
    habits_router,
    bookmarks_router,
    counters_router,
    notes_router,
    sync_router
)

start_time = time.time()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite tables and seed data
    init_db()
    yield

app = FastAPI(
    title="Lemon & Stain Personal Dashboard API",
    description="Production-grade, lightweight REST API for Lemon & Stain Cozy Luxury Study Dashboard",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register domain routers
app.include_router(tasks_router)
app.include_router(events_router)
app.include_router(habits_router)
app.include_router(bookmarks_router)
app.include_router(counters_router)
app.include_router(notes_router)
app.include_router(sync_router)

@app.get("/api/health", response_model=HealthResponse, tags=["System"])
def health_check():
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        environment=settings.APP_ENV,
        database="connected",
        uptime_seconds=round(time.time() - start_time, 2)
    )

@app.get("/", tags=["System"])
def root():
    return {
        "app": "Lemon & Stain Cozy Dashboard API",
        "docs": "/docs",
        "health": "/api/health",
        "status": "paws-itively operational 🐾"
    }
