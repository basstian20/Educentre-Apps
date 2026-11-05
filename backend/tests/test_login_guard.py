"""Brute-force protection on /auth/login (see backend/login_guard.py).

Assumes the defaults: 5 failures per ip+email, 20 per email, and a lock short enough to wait out
(conftest starts the test server with LOGIN_LOCK_SECONDS=6 and TRUST_PROXY=true).
"""
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
MAX_ATTEMPTS = 5
MAX_PER_EMAIL = 20


def _login(email, password, ip=None):
    headers = {"X-Forwarded-For": ip} if ip else {}
    return requests.post(f"{API}/auth/login", json={"email": email, "password": password}, headers=headers, timeout=30)


def _fail_until_locked(email, password="wrong-password"):
    for i in range(1, MAX_ATTEMPTS + 1):
        r = _login(email, password)
        if i < MAX_ATTEMPTS:
            assert r.status_code == 401, f"attempt {i}: {r.status_code} {r.text}"
    return r  # the attempt that trips the lock


@pytest.fixture(scope="module")
def admin_headers():
    r = _login("admin@educentre.id", "admin123")
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture
def student_account(admin_headers):
    """A throw-away student whose password we know."""
    email = f"TEST_lock_{uuid.uuid4().hex[:8]}@educentre.id".lower()
    r = requests.post(
        f"{API}/students",
        json={"email": email, "password": "correct-horse", "full_name": "TEST Lock"},
        headers=admin_headers,
        timeout=30,
    )
    assert r.status_code == 200, r.text
    return email, "correct-horse"


def test_unknown_email_is_locked_after_max_failures():
    email = f"nobody_{uuid.uuid4().hex[:8]}@example.com"
    r = _fail_until_locked(email)
    assert r.status_code == 429
    assert "Too many login attempts" in r.json()["detail"]
    assert int(r.headers["Retry-After"]) >= 1
    # further attempts stay locked
    assert _login(email, "anything").status_code == 429


def test_correct_password_is_rejected_while_locked(student_account):
    email, password = student_account
    assert _fail_until_locked(email).status_code == 429
    assert _login(email, password).status_code == 429


def test_successful_login_resets_the_counter(student_account):
    email, password = student_account
    for _ in range(MAX_ATTEMPTS - 1):
        assert _login(email, "wrong").status_code == 401
    assert _login(email, password).status_code == 200
    # counter started over, so four more failures do not lock
    for _ in range(MAX_ATTEMPTS - 1):
        assert _login(email, "wrong").status_code == 401
    assert _login(email, password).status_code == 200


def test_lock_expires(student_account):
    email, password = student_account
    r = _fail_until_locked(email)
    wait = int(r.headers["Retry-After"])
    if wait > 15:
        pytest.skip("server uses the production lock duration; expiry not tested")
    time.sleep(wait + 1)
    assert _login(email, password).status_code == 200


def test_lock_is_scoped_to_one_email(student_account):
    email, _ = student_account
    assert _fail_until_locked(email).status_code == 429
    assert _login("admin@educentre.id", "admin123").status_code == 200


def test_email_is_locked_across_many_addresses():
    email = f"spray_{uuid.uuid4().hex[:8]}@example.com"
    last = None
    for i in range(MAX_PER_EMAIL):
        last = _login(email, "wrong", ip=f"10.9.{i // 250}.{i % 250 + 1}")
        if last.status_code == 429 and i < MAX_ATTEMPTS:
            pytest.skip("server ignores X-Forwarded-For (TRUST_PROXY off); per-email limit needs distinct IPs")
    assert last.status_code == 429
    # a brand new address is still refused for this email
    assert _login(email, "wrong", ip="10.8.8.8").status_code == 429


def test_admin_can_list_and_clear_lockouts(admin_headers, student_account):
    email, password = student_account
    assert _fail_until_locked(email).status_code == 429

    listed = requests.get(f"{API}/auth/lockouts", headers=admin_headers, timeout=30)
    assert listed.status_code == 200
    assert any(row["email"] == email for row in listed.json())

    cleared = requests.delete(f"{API}/auth/lockouts/{email}", headers=admin_headers, timeout=30)
    assert cleared.status_code == 200 and cleared.json()["cleared"] >= 1
    assert _login(email, password).status_code == 200


def test_lockout_endpoints_are_admin_only(student_account):
    email, password = student_account
    token = _login(email, password).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert requests.get(f"{API}/auth/lockouts", headers=headers, timeout=30).status_code == 403
    assert requests.delete(f"{API}/auth/lockouts/{email}", headers=headers, timeout=30).status_code == 403
    assert requests.get(f"{API}/auth/lockouts", timeout=30).status_code == 401
