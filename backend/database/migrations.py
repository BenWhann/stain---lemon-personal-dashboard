"""Small, idempotent schema migrations for existing SQLite databases.

`Base.metadata.create_all` creates missing tables but never alters existing ones,
so columns added after the first release are patched in here.
"""
import json
import logging
from datetime import date, timedelta
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger("lemon_stain")

# table -> [(column, DDL type/default)]
ADDED_COLUMNS = {
    "tasks": [
        ("position", "INTEGER DEFAULT 0"),
        ("pomodoros", "INTEGER DEFAULT 0"),
        ("completed_at", "DATETIME"),
    ],
}


def _add_missing_columns(engine: Engine) -> None:
    insp = inspect(engine)
    with engine.begin() as conn:
        for table, columns in ADDED_COLUMNS.items():
            if not insp.has_table(table):
                continue
            existing = {c["name"] for c in insp.get_columns(table)}
            for name, ddl in columns:
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))
                    logger.info("migration: added %s.%s", table, name)
                    if table == "tasks" and name == "completed_at":
                        conn.execute(text(
                            "UPDATE tasks SET completed_at = updated_at WHERE completed = 1"
                        ))


def _meta_get(conn, key: str):
    row = conn.execute(text("SELECT value FROM meta WHERE key = :k"), {"k": key}).fetchone()
    return row[0] if row else None


def _meta_set(conn, key: str, value: str) -> None:
    conn.execute(
        text("INSERT INTO meta(key, value) VALUES(:k, :v) "
             "ON CONFLICT(key) DO UPDATE SET value = excluded.value"),
        {"k": key, "v": value},
    )


def _migrate_legacy_habit_days(engine: Engine, today: date) -> None:
    """Convert the old Mon..Sun boolean array into dated checks for the current week."""
    with engine.begin() as conn:
        if _meta_get(conn, "habit_checks_v2") == "done":
            return
        monday = today - timedelta(days=today.weekday())
        habits = conn.execute(text("SELECT id, days_json FROM habits")).fetchall()
        for habit_id, days_json in habits:
            has_checks = conn.execute(
                text("SELECT 1 FROM habit_checks WHERE habit_id = :h LIMIT 1"), {"h": habit_id}
            ).fetchone()
            if has_checks:
                continue
            try:
                days = json.loads(days_json or "[]")
            except ValueError:
                days = []
            for idx, done in enumerate(days[:7]):
                day = monday + timedelta(days=idx)
                if done and day <= today:
                    conn.execute(
                        text("INSERT OR IGNORE INTO habit_checks(habit_id, date) VALUES(:h, :d)"),
                        {"h": habit_id, "d": day.isoformat()},
                    )
        _meta_set(conn, "habit_checks_v2", "done")


def run_migrations(engine: Engine, today: date | None = None) -> None:
    _add_missing_columns(engine)
    _migrate_legacy_habit_days(engine, today or date.today())
