def test_create_event_auto_links_task(authed):
    res = authed.post(
        "/api/events",
        json={
            "title": "Study Session for Finals",
            "date": "2026-11-20",
            "time": "3:00 PM - 5:00 PM",
            "category": "Academic",
            "location": "Library Study Room 4",
        },
    )
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["title"] == "Study Session for Finals"
    assert data["task_id"] is not None
    assert data["task"] is not None
    assert data["task"]["title"] == "Study Session for Finals"
    assert data["task"]["due_date"] == "2026-11-20"


def test_create_event_links_existing_task(authed):
    # First create a task
    t_res = authed.post(
        "/api/tasks",
        json={
            "title": "Existing Assignment Task",
            "category": "Grad School",
            "priority": "Zoomies",
            "due_date": "2026-11-22",
        },
    )
    assert t_res.status_code == 201, t_res.text
    task_id = t_res.json()["id"]

    # Now create an event linking to this task
    ev_res = authed.post(
        "/api/events",
        json={
            "title": "Assignment Due Presentation",
            "date": "2026-11-22",
            "time": "10:00 AM",
            "category": "Academic",
            "task_id": task_id,
        },
    )
    assert ev_res.status_code == 201, ev_res.text
    ev_data = ev_res.json()
    assert ev_data["task_id"] == task_id
    assert ev_data["task"]["id"] == task_id
    assert ev_data["task"]["title"] == "Existing Assignment Task"


def test_update_and_delete_event(authed):
    # Create event
    create_res = authed.post(
        "/api/events",
        json={
            "title": "Coffee with Advisor",
            "date": "2026-11-25",
            "time": "1:00 PM",
            "category": "Academic",
        },
    )
    assert create_res.status_code == 201, create_res.text
    ev_id = create_res.json()["id"]

    # Update event
    up_res = authed.put(
        f"/api/events/{ev_id}",
        json={"location": "Campus Coffee Shop", "time": "1:30 PM"},
    )
    assert up_res.status_code == 200, up_res.text
    assert up_res.json()["location"] == "Campus Coffee Shop"
    assert up_res.json()["time"] == "1:30 PM"

    # Delete event
    del_res = authed.delete(f"/api/events/{ev_id}")
    assert del_res.status_code == 204

    # Get events list
    get_res = authed.get(f"/api/events?date=2026-11-25")
    assert get_res.status_code == 200
    assert not any(e["id"] == ev_id for e in get_res.json())
