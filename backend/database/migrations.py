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
    "events": [
        ("task_id", "INTEGER REFERENCES tasks(id) ON DELETE SET NULL"),
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
                    if engine.dialect.name == "sqlite":
                        sql = "INSERT OR IGNORE INTO habit_checks(habit_id, date) VALUES(:h, :d)"
                    else:
                        sql = "INSERT INTO habit_checks(habit_id, date) VALUES(:h, :d) ON CONFLICT (habit_id, date) DO NOTHING"
                    conn.execute(
                        text(sql),
                        {"h": habit_id, "d": day.isoformat()},
                    )
        _meta_set(conn, "habit_checks_v2", "done")


def _link_orphan_events_to_tasks(engine: Engine) -> None:
    """Ensure every existing calendar event links to a task."""
    insp = inspect(engine)
    if not insp.has_table("events") or not insp.has_table("tasks"):
        return
    existing = {c["name"] for c in insp.get_columns("events")}
    if "task_id" not in existing:
        return

    with engine.begin() as conn:
        rows = conn.execute(text("SELECT id, title, date, category FROM events WHERE task_id IS NULL")).fetchall()
        for ev_id, title, ev_date, cat in rows:
            matching = conn.execute(
                text("SELECT id FROM tasks WHERE title = :t LIMIT 1"), {"t": title}
            ).fetchone()
            if matching:
                conn.execute(
                    text("UPDATE events SET task_id = :tid WHERE id = :eid"),
                    {"tid": matching[0], "eid": ev_id},
                )
            else:
                task_cat = "Grad School" if cat == "Academic" else ("Bills" if cat == "Bills" else ("Work" if cat == "Work" else "Personal"))
                if engine.dialect.name == "sqlite":
                    conn.execute(
                        text(
                            "INSERT INTO tasks (title, category, priority, due_date, source, status, completed, notes, position, pomodoros) "
                            "VALUES (:title, :cat, 'Purr-fect', :due, 'Calendar', 'Pending', 0, 'Auto-linked from calendar event', 0, 0)"
                        ),
                        {"title": title, "cat": task_cat, "due": ev_date},
                    )
                    tid = conn.execute(text("SELECT last_insert_rowid()")).fetchone()[0]
                else:
                    res = conn.execute(
                        text(
                            "INSERT INTO tasks (title, category, priority, due_date, source, status, completed, notes, position, pomodoros) "
                            "VALUES (:title, :cat, 'Purr-fect', :due, 'Calendar', 'Pending', false, 'Auto-linked from calendar event', 0, 0) "
                            "RETURNING id"
                        ),
                        {"title": title, "cat": task_cat, "due": ev_date},
                    )
                    tid = res.fetchone()[0]
                conn.execute(
                    text("UPDATE events SET task_id = :tid WHERE id = :eid"),
                    {"tid": tid, "eid": ev_id},
                )


def _sync_postgres_sequences(engine: Engine) -> None:
    """Prevent duplicate key errors when primary keys were inserted explicitly."""
    if engine.dialect.name != "postgresql":
        return
    with engine.begin() as conn:
        for tbl in ["tasks", "events", "habits", "habit_checks", "bookmarks", "assignments", "focus_sessions", "subtasks"]:
            try:
                conn.execute(text(
                    f"SELECT setval(pg_get_serial_sequence('{tbl}', 'id'), coalesce(max(id), 1), max(id) IS NOT NULL) FROM {tbl}"
                ))
            except Exception as e:
                logger.debug("Sequence sync skipped for %s: %s", tbl, e)


def run_migrations(engine: Engine, today: date | None = None) -> None:
    _add_missing_columns(engine)
    _migrate_legacy_habit_days(engine, today or date.today())
    _link_orphan_events_to_tasks(engine)
    _sync_postgres_sequences(engine)
