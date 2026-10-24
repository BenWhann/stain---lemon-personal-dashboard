import json
from datetime import date

from sqlalchemy import create_engine, text

from database.migrations import run_migrations


def test_legacy_database_is_upgraded(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'old.db'}")
    with engine.begin() as conn:
        conn.execute(text("""CREATE TABLE tasks (id INTEGER PRIMARY KEY, title VARCHAR, completed BOOLEAN,
                             updated_at DATETIME)"""))
        conn.execute(text("INSERT INTO tasks VALUES (1, 'old', 1, '2026-09-01 10:00:00')"))
        conn.execute(text("CREATE TABLE habits (id INTEGER PRIMARY KEY, days_json TEXT)"))
        conn.execute(text("INSERT INTO habits VALUES (1, :d)"),
                     {"d": json.dumps([True, True, False, True, False, False, False])})
        conn.execute(text("CREATE TABLE habit_checks (id INTEGER PRIMARY KEY, habit_id INTEGER, date VARCHAR, "
                          "UNIQUE(habit_id, date))"))
        conn.execute(text("CREATE TABLE meta (key VARCHAR PRIMARY KEY, value TEXT)"))

    # Thursday 2026-10-22: Mon/Tue/Thu were ticked in the legacy array
    run_migrations(engine, today=date(2026, 10, 22))
    run_migrations(engine, today=date(2026, 10, 22))  # idempotent

    with engine.connect() as conn:
        cols = {r[1] for r in conn.execute(text("PRAGMA table_info(tasks)"))}
        assert {"position", "pomodoros", "completed_at"} <= cols
        assert conn.execute(text("SELECT completed_at FROM tasks")).scalar() == "2026-09-01 10:00:00"
        days = [r[0] for r in conn.execute(text("SELECT date FROM habit_checks ORDER BY date"))]
        assert days == ["2026-10-19", "2026-10-20", "2026-10-22"]
