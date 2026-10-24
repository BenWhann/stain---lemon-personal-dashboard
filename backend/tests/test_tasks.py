def test_create_task_with_subtasks(authed):
    res = authed.post("/api/tasks", json={
        "title": "Write reflection paper", "category": "Grad School", "priority": "Zoomies",
        "due_date": "2026-10-30", "subtasks": ["Outline", "Draft", " "],
    })
    assert res.status_code == 201, res.text
    task = res.json()
    assert [s["title"] for s in task["subtasks"]] == ["Outline", "Draft"]
    assert task["completed_at"] is None


def test_blank_due_date_becomes_null(authed):
    res = authed.post("/api/tasks", json={"title": "Someday", "due_date": ""})
    assert res.status_code == 201
    assert res.json()["due_date"] is None


def test_invalid_priority_rejected(authed):
    assert authed.post("/api/tasks", json={"title": "x", "priority": "Urgent"}).status_code == 422


def test_toggle_sets_and_clears_completed_at(authed):
    tid = authed.post("/api/tasks", json={"title": "Pay rent"}).json()["id"]
    done = authed.post(f"/api/tasks/{tid}/toggle").json()
    assert done["completed"] and done["status"] == "Completed" and done["completed_at"]
    undone = authed.post(f"/api/tasks/{tid}/toggle").json()
    assert not undone["completed"] and undone["status"] == "Pending" and undone["completed_at"] is None


def test_status_drives_completion(authed):
    tid = authed.post("/api/tasks", json={"title": "Read chapter"}).json()["id"]
    t = authed.put(f"/api/tasks/{tid}", json={"status": "In Progress"}).json()
    assert t["status"] == "In Progress" and not t["completed"]
    t = authed.put(f"/api/tasks/{tid}", json={"status": "Completed"}).json()
    assert t["completed"] and t["completed_at"]


def test_subtask_crud(authed):
    tid = authed.post("/api/tasks", json={"title": "Prep supervision"}).json()["id"]
    sub = authed.post(f"/api/tasks/{tid}/subtasks", json={"title": "List questions"}).json()
    upd = authed.put(f"/api/tasks/{tid}/subtasks/{sub['id']}", json={"done": True}).json()
    assert upd["done"] is True
    assert authed.get(f"/api/tasks/{tid}").json()["subtasks"][0]["done"] is True
    assert authed.delete(f"/api/tasks/{tid}/subtasks/{sub['id']}").status_code == 204
    assert authed.get(f"/api/tasks/{tid}").json()["subtasks"] == []
    other = authed.post("/api/tasks", json={"title": "Other"}).json()["id"]
    sub2 = authed.post(f"/api/tasks/{tid}/subtasks", json={"title": "x"}).json()
    assert authed.put(f"/api/tasks/{other}/subtasks/{sub2['id']}", json={"done": True}).status_code == 404


def test_deleting_task_removes_subtasks(authed):
    tid = authed.post("/api/tasks", json={"title": "Temp", "subtasks": ["a"]}).json()["id"]
    assert authed.delete(f"/api/tasks/{tid}").status_code == 204
    assert authed.get(f"/api/tasks/{tid}").status_code == 404


def test_reorder(authed):
    a = authed.post("/api/tasks", json={"title": "A"}).json()["id"]
    b = authed.post("/api/tasks", json={"title": "B"}).json()["id"]
    res = authed.put("/api/tasks/reorder", json={"ids": [b, a]})
    assert [t["position"] for t in res.json()] == [0, 1]


def test_focus_session_credits_task_and_paws(authed):
    tid = authed.post("/api/tasks", json={"title": "Deep work"}).json()["id"]
    before = authed.get("/api/counters").json()["focus_paws"]
    res = authed.post("/api/focus/sessions", json={"date": "2026-10-24", "minutes": 25, "task_id": tid})
    assert res.status_code == 201
    assert authed.get(f"/api/tasks/{tid}").json()["pomodoros"] == 1
    assert authed.get("/api/counters").json()["focus_paws"] == before + 1
    sessions = authed.get("/api/focus/sessions", params={"since": "2026-10-01"}).json()
    assert any(s["task_id"] == tid for s in sessions)


def test_assignment_update(authed):
    a = authed.post("/api/notes/msw/assignments", json={"course": "Field Seminar", "name": "Journal"}).json()
    res = authed.put(f"/api/notes/msw/assignments/{a['id']}", json={"status": "Completed"})
    assert res.status_code == 200 and res.json()["status"] == "Completed"
    assert authed.put(f"/api/notes/msw/assignments/{a['id']}", json={"status": "Done"}).status_code == 422


def test_bookmark_url_normalized(authed):
    res = authed.post("/api/bookmarks", json={"title": "Moodle", "url": "moodle.augsburg.edu"})
    assert res.json()["url"] == "https://moodle.augsburg.edu"
