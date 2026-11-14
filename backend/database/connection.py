import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

logger = logging.getLogger("lemon_stain")

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

is_sqlite = db_url.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

if is_sqlite:
    @event.listens_for(engine, "connect")
    def _sqlite_pragmas(dbapi_conn, _record):
        cur = dbapi_conn.cursor()
        # WAL keeps reads fast while a write (or an online backup) is running
        cur.execute("PRAGMA journal_mode=WAL")
        cur.execute("PRAGMA foreign_keys=ON")
        cur.execute("PRAGMA busy_timeout=5000")
        cur.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


_db_initialized = False


def ensure_db():
    global _db_initialized
    if not _db_initialized:
        try:
            init_db()
        except Exception as e:
            logger.warning("ensure_db error: %s", e)
        _db_initialized = True


def get_db():
    ensure_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from models import db_models  # noqa: F401  (registers tables)
    from database.migrations import run_migrations
    from database.seed_data import seed_initial_data
    from security import ensure_initial_user

    Base.metadata.create_all(bind=engine)
    run_migrations(engine)

    db = SessionLocal()
    try:
        seed_initial_data(db)
        ensure_initial_user(db)
    finally:
        db.close()
