import os
import sys
import tempfile
from pathlib import Path

import pytest

# Configure an isolated database before the app (and its settings) are imported
_tmp = tempfile.mkdtemp(prefix="lemon-stain-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_tmp) / 'test.db'}"
os.environ["APP_ENV"] = "test"
os.environ["ADMIN_USERNAME"] = "aretta"
os.environ["ADMIN_PASSWORD"] = "correct-horse-battery"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402
from security import login_throttle  # noqa: E402

HEADERS = {"X-Requested-With": "lemon-stain"}


@pytest.fixture()
def client():
    with TestClient(app) as c:
        login_throttle._failures.clear()
        yield c


@pytest.fixture()
def authed(client):
    res = client.post("/api/auth/login", json={"username": "aretta", "password": "correct-horse-battery"},
                      headers=HEADERS)
    assert res.status_code == 200, res.text
    client.headers.update(HEADERS)
    return client
