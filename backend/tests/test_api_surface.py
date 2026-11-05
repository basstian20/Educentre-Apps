"""Guards the public API surface and per-role access on every router.

* ``test_route_list_matches_snapshot`` fails when an endpoint is added, removed or renamed, so
  refactors cannot silently change the API. After an intentional change regenerate the snapshot with
  ``UPDATE_API_SURFACE=1 pytest backend/tests/test_api_surface.py``.
* The smoke tests hit one read endpoint per router for every role.
"""
import json
import os
from pathlib import Path

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
SNAPSHOT = Path(__file__).parent / "api_surface.json"

CREDS = {
    "admin": ("admin@educentre.id", "admin123"),
    "educator": ("fariz@educentre.id", "educator123"),
    "student": ("aiman@educentre.id", "student123"),
    "parent": ("ibu.nur@educentre.id", "parent123"),
}

# One list endpoint per router (path, roles that may read it).
ALL = {"admin", "educator", "student", "parent"}
READ_ENDPOINTS = [
    ("/auth/me", ALL),
    ("/users", {"admin"}),
    ("/students", ALL),
    ("/educators", ALL),
    ("/parents", {"admin"}),
    ("/classes", ALL),
    ("/enrollments", ALL),
    ("/attendance", ALL),
    ("/invoices", ALL),
    ("/payments", ALL),
    ("/assessments", ALL),
    ("/grades", ALL),
    ("/materials", ALL),
    ("/announcements", ALL),
    ("/settings", ALL),
    ("/notifications", ALL),
    ("/dashboard/stats", ALL),
]


@pytest.fixture(scope="module")
def sessions():
    out = {}
    for role, (email, password) in CREDS.items():
        r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
        assert r.status_code == 200, f"{role} login failed: {r.status_code} {r.text}"
        s = requests.Session()
        s.headers["Authorization"] = f"Bearer {r.json()['access_token']}"
        out[role] = s
    return out


def _surface():
    spec = requests.get(f"{BASE_URL}/openapi.json", timeout=30).json()
    return sorted(
        f"{method.upper()} {path}"
        for path, ops in spec["paths"].items()
        for method in ops
        if method in {"get", "post", "put", "patch", "delete"}
    )


def test_route_list_matches_snapshot():
    current = _surface()
    if os.environ.get("UPDATE_API_SURFACE"):
        SNAPSHOT.write_text(json.dumps(current, indent=2) + "\n", encoding="utf-8")
        pytest.skip("snapshot regenerated")
    expected = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    added = sorted(set(current) - set(expected))
    removed = sorted(set(expected) - set(current))
    assert not added and not removed, (
        f"API surface changed. Added: {added}. Removed: {removed}. "
        "If intentional, rerun with UPDATE_API_SURFACE=1 and commit api_surface.json."
    )


@pytest.mark.parametrize("path,roles", READ_ENDPOINTS)
@pytest.mark.parametrize("role", sorted(ALL))
def test_read_endpoint_by_role(sessions, role, path, roles):
    r = sessions[role].get(f"{API}{path}", timeout=30)
    if role in roles:
        assert r.status_code == 200, f"{role} GET {path} -> {r.status_code} {r.text[:200]}"
    else:
        assert r.status_code == 403, f"{role} GET {path} should be forbidden, got {r.status_code}"


@pytest.mark.parametrize("path,_roles", READ_ENDPOINTS)
def test_read_endpoint_requires_login(path, _roles):
    r = requests.get(f"{API}{path}", timeout=30)
    assert r.status_code == 401, f"anonymous GET {path} -> {r.status_code}"
