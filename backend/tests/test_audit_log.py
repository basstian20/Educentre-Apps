"""Audit trail (backend/audit.py, GET /api/audit-logs)."""
import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


def _login(email, password, ip=None):
    headers = {"X-Forwarded-For": ip} if ip else {}
    return requests.post(f"{API}/auth/login", json={"email": email, "password": password}, headers=headers, timeout=30)


def _auth(email, password):
    r = _login(email, password)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture(scope="module")
def admin():
    return _auth("admin@educentre.id", "admin123")


def _logs(admin, **params):
    r = requests.get(f"{API}/audit-logs", params=params, headers=admin, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


def _find(admin, **params):
    return _logs(admin, limit=200, **params)["items"]


def _invoice(admin):
    student_id = requests.get(f"{API}/students", headers=admin, timeout=30).json()[0]["id"]
    r = requests.post(
        f"{API}/invoices",
        json={"student_id": student_id, "billing_month": "2026-11", "items": [{"description": "TEST audit", "amount": 50000}], "due_date": "2099-01-01"},
        headers=admin,
        timeout=30,
    )
    assert r.status_code == 200, r.text
    return r.json()


def test_non_admin_is_rejected(admin):
    assert requests.get(f"{API}/audit-logs", timeout=30).status_code == 401
    for email, pw in (("fariz@educentre.id", "educator123"), ("aiman@educentre.id", "student123"), ("ibu.nur@educentre.id", "parent123")):
        r = _login(email, pw)
        assert r.status_code == 200, r.text
        headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
        assert requests.get(f"{API}/audit-logs", headers=headers, timeout=30).status_code == 403


def test_invoice_lifecycle_is_recorded(admin):
    inv = _invoice(admin)
    created = _find(admin, entity="invoice", entity_id=inv["id"], action="create")
    assert len(created) == 1
    row = created[0]
    assert row["actor_role"] == "admin" and row["actor_name"] and row["ip"]
    assert row["changes"]["total_amount"] == {"from": None, "to": 50000}

    requests.patch(f"{API}/invoices/{inv['id']}", json={"notes": "after"}, headers=admin, timeout=30)
    upd = _find(admin, entity="invoice", entity_id=inv["id"], action="update")[0]
    # only the changed field is stored, bookkeeping fields are not
    assert upd["changes"] == {"notes": {"from": None, "to": "after"}}

    requests.delete(f"{API}/invoices/{inv['id']}", headers=admin, timeout=30)
    assert _find(admin, entity="invoice", entity_id=inv["id"], action="delete")
    requests.post(f"{API}/trash/invoices/{inv['id']}/restore", headers=admin, timeout=30)
    assert _find(admin, entity="invoice", entity_id=inv["id"], action="restore")
    requests.delete(f"{API}/invoices/{inv['id']}", headers=admin, timeout=30)
    assert requests.delete(f"{API}/trash/invoices/{inv['id']}", headers=admin, timeout=30).status_code == 200
    assert _find(admin, entity="invoice", entity_id=inv["id"], action="purge")


def test_payment_recorded(admin):
    inv = _invoice(admin)
    r = requests.post(f"{API}/payments", json={"invoice_id": inv["id"], "amount": 50000, "method": "cash"}, headers=admin, timeout=30)
    assert r.status_code == 200, r.text
    row = _find(admin, entity="payment", entity_id=r.json()["id"])[0]
    assert row["action"] == "create"
    assert row["changes"]["status"] == {"from": "unpaid", "to": "paid"}


def test_sensitive_fields_are_masked(admin):
    email = f"audit-{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(
        f"{API}/auth/register",
        json={"email": email, "password": "SuperSecret1!", "full_name": "Audit Probe", "role": "educator"},
        headers=admin,
        timeout=30,
    )
    assert r.status_code == 200, r.text
    row = _find(admin, entity="user", entity_id=r.json()["id"])[0]
    blob = str(row)
    assert "SuperSecret1!" not in blob and "$2b$" not in blob and "password" not in row["changes"]


def test_auth_events(admin):
    email = f"audit-{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(
        f"{API}/auth/register",
        json={"email": email, "password": "Passw0rd!", "full_name": "Lock Probe", "role": "student"},
        headers=admin,
        timeout=30,
    )
    assert r.status_code == 200
    uid = r.json()["id"]

    assert _login(email, "Passw0rd!", ip="203.0.113.7").status_code == 200
    ok = _find(admin, action="login_success", entity_id=uid)
    assert ok and ok[0]["ip"] == "203.0.113.7"

    for _ in range(5):
        _login(email, "wrong", ip="203.0.113.8")
    assert _find(admin, action="login_locked", entity_id=uid)

    assert requests.delete(f"{API}/auth/lockouts/{email}", headers=admin, timeout=30).status_code == 200
    assert any(email in i["summary"] for i in _find(admin, action="unlock"))

    token = requests.post(f"{API}/auth/forgot-password", json={"email": email}, timeout=30).json().get("debug_reset_url", "").split("token=")[-1]
    assert token
    assert _find(admin, action="password_reset_requested", entity_id=uid)
    assert requests.post(f"{API}/auth/reset-password", json={"token": token, "new_password": "NewPassw0rd!"}, timeout=30).status_code == 200
    reset = _find(admin, action="password_reset", entity_id=uid)
    assert reset and reset[0]["actor_id"] == uid


def test_filters_and_pagination(admin):
    for _ in range(3):
        _invoice(admin)
    everything = _logs(admin, limit=1)
    assert len(everything["items"]) == 1 and everything["total"] >= 3

    page1 = _logs(admin, entity="invoice", action="create", limit=2, skip=0)
    page2 = _logs(admin, entity="invoice", action="create", limit=2, skip=2)
    assert len(page1["items"]) == 2 and page1["total"] == page2["total"] >= 3
    assert not {i["id"] for i in page1["items"]} & {i["id"] for i in page2["items"]}
    ats = [i["at"] for i in page1["items"]]
    assert ats == sorted(ats, reverse=True)

    actor = page1["items"][0]["actor_id"]
    assert all(i["actor_id"] == actor for i in _find(admin, actor_id=actor))

    today = datetime.now(timezone.utc).date().isoformat()
    assert _logs(admin, date_from=today, date_to=today)["total"] >= 3
    future = (datetime.now(timezone.utc).date() + timedelta(days=2)).isoformat()
    assert _logs(admin, date_from=future)["total"] == 0
    assert requests.get(f"{API}/audit-logs", params={"date_from": "nope"}, headers=admin, timeout=30).status_code == 400
    assert requests.get(f"{API}/audit-logs", params={"limit": 999}, headers=admin, timeout=30).status_code == 422
    assert _logs(admin, q="invoice INV-")["total"] >= 1
