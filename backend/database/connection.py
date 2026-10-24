import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

logger = logging.getLogger("lemon_stain")

is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    settings.DATABASE_URL,
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


def get_db():
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
