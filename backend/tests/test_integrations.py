from unittest.mock import patch
from config import settings


def test_integration_status_unauthorized(client):
    res = client.get("/api/integrations/status")
    assert res.status_code == 401


def test_integration_status_authorized_with_key(client):
    key = settings.effective_integration_key
    res = client.get("/api/integrations/status", headers={"X-Integration-Key": key})
    assert res.status_code == 200
    data = res.json()
    assert data["integration_configured"] is True
    assert "/api/integrations/ai-tasks" in data["webhook_url"]


def test_integration_status_authorized_with_session(authed):
    res = authed.get("/api/integrations/status")
    assert res.status_code == 200
    data = res.json()
    assert data["integration_configured"] is True


def test_integration_script_generation(client):
    key = settings.effective_integration_key
    res = client.get("/api/integrations/script", headers={"X-Integration-Key": key})
    assert res.status_code == 200
    assert "scanInboxAndCalendar" in res.text
    assert key in res.text


def test_ingest_ai_tasks_success(client):
    key = settings.effective_integration_key
    payload = {
        "tasks": [
            {
                "title": "Submit IRB Application Draft",
                "category": "Grad School",
                "priority": "Zoomies",
                "due_date": "2026-11-25",
                "source": "Gmail",
                "source_id": "thread_abc123",
                "notes": "From: advisor@university.edu\nSubject: Draft IRB protocols",
                "subtasks": [
                    "Review section 4 informed consent",
                    "Sign ethics declaration",
                ],
            }
        ]
    }

    res = client.post(
        "/api/integrations/ai-tasks",
        json=payload,
        headers={"X-Integration-Key": key},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["added_count"] == 1
    assert data["skipped_count"] == 0
    assert len(data["tasks"]) == 1
    created = data["tasks"][0]
    assert created["title"] == "Submit IRB Application Draft"
    assert created["category"] == "Grad School"
    assert created["priority"] == "Zoomies"
    assert created["due_date"] == "2026-11-25"
    assert "Gmail: thread_abc123" in created["source"]
    assert len(created["subtasks"]) == 2


def test_ingest_ai_tasks_deduplication(client):
    key = settings.effective_integration_key
    payload = {
        "tasks": [
            {
                "title": "Follow up with Lab Technician",
                "category": "Work",
                "priority": "Purr-fect",
                "source": "Gmail",
                "source_id": "thread_unique_456",
            }
        ]
    }

    # First ingestion: should add
    res1 = client.post(
        "/api/integrations/ai-tasks",
        json=payload,
        headers={"X-Integration-Key": key},
    )
    assert res1.status_code == 200
    assert res1.json()["added_count"] == 1

    # Second ingestion with same source_id: should skip
    res2 = client.post(
        "/api/integrations/ai-tasks",
        json=payload,
        headers={"X-Integration-Key": key},
    )
    assert res2.status_code == 200
    assert res2.json()["added_count"] == 0
    assert res2.json()["skipped_count"] == 1


def test_extract_task_without_api_key(client):
    key = settings.effective_integration_key
    # Temporarily ensure GEMINI_API_KEY is unset
    with patch.object(settings, "GEMINI_API_KEY", ""):
        res = client.post(
            "/api/integrations/extract-task",
            json={"content": "Please send the file by Monday."},
            headers={"X-Integration-Key": key},
        )
        assert res.status_code == 400
        assert "Gemini API key is not configured" in res.json()["detail"]


@patch("routes.integrations.call_gemini_extraction")
def test_extract_task_mocked_gemini(mock_call, client):
    key = settings.effective_integration_key
    mock_call.return_value = {
        "has_action_items": True,
        "summary": "Request to review lab data by Wednesday.",
        "tasks": [
            {
                "title": "Review Wednesday Lab Analysis",
                "category": "Work",
                "priority": "Zoomies",
                "due_date": "2026-11-18",
                "notes": "Sender requested immediate review",
                "subtasks": ["Check spectrometry results", "Email feedback"],
            }
        ],
    }

    payload = {
        "content": "Hi Aretta, could you review Wednesday lab analysis by Nov 18? Thanks!",
        "context": "Email from Dr. Smith",
        "api_key": "fake-gemini-key",
        "auto_save": True,
    }

    res = client.post(
        "/api/integrations/extract-task",
        json=payload,
        headers={"X-Integration-Key": key},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["has_action_items"] is True
    assert len(data["extracted_tasks"]) == 1
    assert len(data["saved_tasks"]) == 1
    assert data["saved_tasks"][0]["title"] == "Review Wednesday Lab Analysis"
