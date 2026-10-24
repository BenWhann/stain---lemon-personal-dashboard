from tests.conftest import HEADERS


def test_protected_routes_require_login(client):
    for path in ["/api/tasks", "/api/events", "/api/habits", "/api/bookmarks",
                 "/api/counters", "/api/notes/study_notes", "/api/focus/sessions"]:
        assert client.get(path).status_code == 401, path


def test_health_is_public(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["database"] == "connected"


def test_status_reports_account(client):
    body = client.get("/api/auth/status").json()
    assert body == {"authenticated": False, "account_exists": True, "user": None}


def test_login_sets_httponly_cookie(client):
    res = client.post("/api/auth/login", json={"username": "Aretta", "password": "correct-horse-battery"},
                      headers=HEADERS)
    assert res.status_code == 200
    cookie = res.headers["set-cookie"]
    assert "ls_session=" in cookie
    assert "HttpOnly" in cookie
    assert "SameSite=strict" in cookie
    assert client.get("/api/auth/status").json()["authenticated"] is True
    assert client.get("/api/tasks").status_code == 200


def test_login_requires_csrf_header(client):
    res = client.post("/api/auth/login", json={"username": "aretta", "password": "correct-horse-battery"})
    assert res.status_code == 403


def test_wrong_password_is_rejected_then_throttled(client):
    for _ in range(5):
        res = client.post("/api/auth/login", json={"username": "aretta", "password": "nope-nope-nope"},
                          headers=HEADERS)
        assert res.status_code == 401
    res = client.post("/api/auth/login", json={"username": "aretta", "password": "correct-horse-battery"},
                      headers=HEADERS)
    assert res.status_code == 429
    assert "Retry-After" in res.headers


def test_mutations_require_csrf_header(authed):
    res = authed.post("/api/tasks", json={"title": "x"}, headers={"X-Requested-With": ""})
    assert res.status_code == 403


def test_logout_ends_session(authed):
    assert authed.post("/api/auth/logout").status_code == 204
    assert authed.get("/api/tasks").status_code == 401


def test_change_password(authed):
    bad = authed.post("/api/auth/password", json={"current_password": "wrong-password",
                                                    "new_password": "another-long-pass"})
    assert bad.status_code == 400
    short = authed.post("/api/auth/password", json={"current_password": "correct-horse-battery",
                                                      "new_password": "short"})
    assert short.status_code == 422
    ok = authed.post("/api/auth/password", json={"current_password": "correct-horse-battery",
                                                   "new_password": "a-brand-new-passphrase"})
    assert ok.status_code == 204
    # current session survives the change
    assert authed.get("/api/auth/me").status_code == 200
    # restore for other tests
    authed.post("/api/auth/password", json={"current_password": "a-brand-new-passphrase",
                                             "new_password": "correct-horse-battery"})


def test_profile_update(authed):
    res = authed.put("/api/auth/profile", json={"display_name": "Aretta J."})
    assert res.json()["display_name"] == "Aretta J."


def test_docs_only_in_dev(client):
    # APP_ENV=test counts as dev; with APP_ENV=production main.py serves no /docs or /openapi.json
    assert client.get("/docs").status_code == 200
