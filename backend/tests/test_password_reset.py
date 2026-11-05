"""Forgot / reset password flow (see backend/password_reset.py).

The test server runs with MAIL_PROVIDER=console and PASSWORD_RESET_DEBUG_LINK=true (set in conftest), so
the reset link comes back in the response instead of an inbox. Against an external server without that
flag the link-dependent tests are skipped.
"""
import hashlib
import os
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qs, urlparse

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
OLD_PASSWORD = "old-password-1"


def _login(email, password):
    return requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)


def _forgot(email):
    r = requests.post(f"{API}/auth/forgot-password", json={"email": email}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


def _token(body):
    url = body.get("debug_reset_url")
    if not url:
        pytest.skip("server does not expose the reset link (PASSWORD_RESET_DEBUG_LINK is off)")
    return parse_qs(urlparse(url).query)["token"][0]


def _reset(token, password):
    return requests.post(f"{API}/auth/reset-password", json={"token": token, "new_password": password}, timeout=30)


@pytest.fixture(scope="module")
def admin_headers():
    r = _login("admin@educentre.id", "admin123")
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture
def account(admin_headers):
    email = f"test_reset_{uuid.uuid4().hex[:8]}@educentre.id"
    r = requests.post(
        f"{API}/students",
        json={"email": email, "password": OLD_PASSWORD, "full_name": "TEST Reset"},
        headers=admin_headers,
        timeout=30,
    )
    assert r.status_code == 200, r.text
    return {"email": email, "student_id": r.json()["id"]}


def test_unknown_email_gets_the_same_answer():
    body = _forgot(f"nobody_{uuid.uuid4().hex[:8]}@example.com")
    assert body == {"ok": True}


def test_invalid_email_format_is_rejected():
    r = requests.post(f"{API}/auth/forgot-password", json={"email": "not-an-email"}, timeout=30)
    assert r.status_code == 422


def test_full_reset_flow(account):
    token = _token(_forgot(account["email"]))
    assert _reset(token, "brand-new-pass").status_code == 200
    assert _login(account["email"], "brand-new-pass").status_code == 200
    assert _login(account["email"], OLD_PASSWORD).status_code == 401


def test_email_match_is_case_insensitive(account):
    token = _token(_forgot(account["email"].upper()))
    assert _reset(token, "brand-new-pass").status_code == 200


def test_token_works_only_once(account):
    token = _token(_forgot(account["email"]))
    assert _reset(token, "first-new-pass").status_code == 200
    again = _reset(token, "second-new-pass")
    assert again.status_code == 400
    assert again.json()["detail"] == "Invalid or expired reset link"
    assert _login(account["email"], "first-new-pass").status_code == 200


def test_weak_password_does_not_burn_the_link(account):
    token = _token(_forgot(account["email"]))
    weak = _reset(token, "123")
    assert weak.status_code == 400
    assert weak.json()["detail"] == "New password must be at least 6 characters"
    assert _reset(token, "long-enough-pass").status_code == 200


def test_garbage_and_empty_tokens_are_rejected():
    assert _reset("definitely-not-a-token", "long-enough-pass").status_code == 400
    assert _reset("", "long-enough-pass").status_code == 400
    assert _reset("x" * 500, "long-enough-pass").status_code == 400


def test_new_request_revokes_the_previous_link(account):
    first = _token(_forgot(account["email"]))
    second = _token(_forgot(account["email"]))
    assert _reset(first, "long-enough-pass").status_code == 400
    assert _reset(second, "long-enough-pass").status_code == 200


def test_expired_link_is_rejected(account, mongo_db):
    token = _token(_forgot(account["email"]))
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    past = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=1)
    assert mongo_db.password_resets.update_one({"_id": token_hash}, {"$set": {"expires_at": past}}).matched_count == 1
    expired = _reset(token, "long-enough-pass")
    assert expired.status_code == 400
    assert _login(account["email"], OLD_PASSWORD).status_code == 200  # password untouched


def test_requests_are_throttled_per_account(account):
    for _ in range(3):
        assert "debug_reset_url" in _forgot(account["email"])
    # fourth request within the hour: same answer, but no link is issued
    assert _forgot(account["email"]) == {"ok": True}


def test_reset_lifts_a_login_lock(account):
    for _ in range(5):
        last = _login(account["email"], "wrong-password")
    assert last.status_code == 429
    assert _login(account["email"], OLD_PASSWORD).status_code == 429
    token = _token(_forgot(account["email"]))
    assert _reset(token, "after-lock-pass").status_code == 200
    assert _login(account["email"], "after-lock-pass").status_code == 200


def test_disabled_account_gets_no_link(account, admin_headers):
    r = requests.delete(f"{API}/students/{account['student_id']}", headers=admin_headers, timeout=30)
    assert r.status_code == 200
    assert _forgot(account["email"]) == {"ok": True}
