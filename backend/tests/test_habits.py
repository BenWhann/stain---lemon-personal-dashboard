from datetime import date, timedelta

from routes.habits import best_streak, current_streak

TODAY = date(2026, 10, 24)


def d(offset):
    return (TODAY - timedelta(days=offset)).isoformat()


def test_current_streak_counts_through_yesterday_when_today_open():
    assert current_streak([d(1), d(2), d(3)], TODAY) == 3


def test_current_streak_includes_today():
    assert current_streak([d(0), d(1)], TODAY) == 2


def test_current_streak_breaks_on_gap():
    assert current_streak([d(0), d(2), d(3)], TODAY) == 1
    assert current_streak([d(2), d(3)], TODAY) == 0


def test_best_streak():
    assert best_streak([d(10), d(9), d(8), d(2), d(1)]) == 3
    assert best_streak([]) == 0


def test_check_and_uncheck_day(authed):
    h = authed.post("/api/habits", params={"today": TODAY.isoformat()},
                    json={"name": "Stretch", "icon": "🧘‍♀️"}).json()
    assert h["streak"] == 0 and h["checks"] == []
    params = {"today": TODAY.isoformat()}
    h = authed.put(f"/api/habits/{h['id']}/checks/{d(1)}", params=params).json()
    h = authed.put(f"/api/habits/{h['id']}/checks/{d(0)}", params=params).json()
    assert h["streak"] == 2 and h["checks"] == [d(1), d(0)]
    # idempotent
    h = authed.put(f"/api/habits/{h['id']}/checks/{d(0)}", params=params).json()
    assert h["checks"] == [d(1), d(0)]
    h = authed.put(f"/api/habits/{h['id']}/checks/{d(0)}", params={**params, "done": "false"}).json()
    assert h["streak"] == 1 and h["checks"] == [d(1)]


def test_future_check_rejected(authed):
    h = authed.post("/api/habits", json={"name": "Future"}).json()
    res = authed.put(f"/api/habits/{h['id']}/checks/{(TODAY + timedelta(days=1)).isoformat()}",
                     params={"today": TODAY.isoformat()})
    assert res.status_code == 400


def test_seeded_habits_have_streaks(authed):
    habits = authed.get("/api/habits").json()
    playtime = next(h for h in habits if h["name"].startswith("Playtime"))
    assert playtime["streak"] == 21
