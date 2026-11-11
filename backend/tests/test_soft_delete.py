"""Soft delete + admin trash (see backend/routers/trash.py) and the atomic invoice counter."""
import os
import uuid

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


def _login(email, password):
    return requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)


@pytest.fixture(scope="module")
def admin():
    r = _login("admin@educentre.id", "admin123")
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture(scope="module")
def student_id(admin):
    r = requests.get(f"{API}/students", headers=admin, timeout=30)
    return r.json()[0]["id"]


@pytest.fixture(scope="module")
def class_id(admin):
    return requests.get(f"{API}/classes", headers=admin, timeout=30).json()[0]["id"]


def _ids(resp):
    return {d["id"] for d in resp.json()}


def _trash(admin, kind=None):
    r = requests.get(f"{API}/trash", params={"type": kind} if kind else {}, headers=admin, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


def _trash_ids(admin, kind):
    return {i["id"] for i in _trash(admin, kind)}


def _invoice(admin, student_id, amount=100000):
    r = requests.post(
        f"{API}/invoices",
        json={
            "student_id": student_id,
            "billing_month": "2026-11",
            "items": [{"description": "TEST soft delete", "amount": amount}],
            "due_date": "2099-01-01",
        },
        headers=admin,
        timeout=30,
    )
    assert r.status_code == 200, r.text
    return r.json()


def _seq(inv):
    return int(inv["invoice_number"].rsplit("-", 1)[-1])


def test_invoice_trash_cycle(admin, student_id):
    inv = _invoice(admin, student_id)
    assert requests.delete(f"{API}/invoices/{inv['id']}", headers=admin, timeout=30).status_code == 200

    assert inv["id"] not in _ids(requests.get(f"{API}/invoices", headers=admin, timeout=30))
    assert requests.get(f"{API}/invoices/{inv['id']}", headers=admin, timeout=30).status_code == 404
    pay = {"invoice_id": inv["id"], "amount": 1000, "method": "cash"}
    assert requests.post(f"{API}/payments", json=pay, headers=admin, timeout=30).status_code == 404
    assert inv["id"] in _trash_ids(admin, "invoices")

    assert requests.post(f"{API}/trash/invoices/{inv['id']}/restore", headers=admin, timeout=30).status_code == 200
    assert inv["id"] in _ids(requests.get(f"{API}/invoices", headers=admin, timeout=30))
    assert inv["id"] not in _trash_ids(admin, "invoices")


def test_trashed_invoice_leaves_dashboard_totals(admin, student_id):
    stats = lambda: requests.get(f"{API}/dashboard/stats", headers=admin, timeout=30).json()["outstanding_fees"]
    before = stats()
    inv = _invoice(admin, student_id, amount=777000)
    assert stats() == before + 777000
    requests.delete(f"{API}/invoices/{inv['id']}", headers=admin, timeout=30)
    assert stats() == before


def test_invoice_numbers_never_reused(admin, student_id):
    a = _invoice(admin, student_id)
    b = _invoice(admin, student_id)
    requests.delete(f"{API}/invoices/{a['id']}", headers=admin, timeout=30)
    requests.delete(f"{API}/invoices/{b['id']}", headers=admin, timeout=30)
    requests.delete(f"{API}/trash/invoices/{b['id']}", headers=admin, timeout=30)  # even a purged number stays used
    c = _invoice(admin, student_id)
    assert _seq(b) == _seq(a) + 1
    assert _seq(c) == _seq(b) + 1


def test_paid_invoice_cannot_be_deleted(admin, student_id):
    inv = _invoice(admin, student_id)
    pay = {"invoice_id": inv["id"], "amount": 5000, "method": "cash"}
    assert requests.post(f"{API}/payments", json=pay, headers=admin, timeout=30).status_code == 200
    assert requests.delete(f"{API}/invoices/{inv['id']}", headers=admin, timeout=30).status_code == 400
    assert inv["id"] not in _trash_ids(admin, "invoices")


def test_purge_only_from_trash(admin, student_id):
    inv = _invoice(admin, student_id)
    assert requests.delete(f"{API}/trash/invoices/{inv['id']}", headers=admin, timeout=30).status_code == 404  # still live
    requests.delete(f"{API}/invoices/{inv['id']}", headers=admin, timeout=30)
    assert requests.delete(f"{API}/trash/invoices/{inv['id']}", headers=admin, timeout=30).status_code == 200
    assert inv["id"] not in _trash_ids(admin, "invoices")
    assert requests.post(f"{API}/trash/invoices/{inv['id']}/restore", headers=admin, timeout=30).status_code == 404


def test_announcement_trash_cycle(admin):
    body = {"title": "TEST ann", "body": "x", "audience": "all"}
    aid = requests.post(f"{API}/announcements", json=body, headers=admin, timeout=30).json()["id"]
    assert requests.delete(f"{API}/announcements/{aid}", headers=admin, timeout=30).status_code == 200
    assert aid not in _ids(requests.get(f"{API}/announcements", headers=admin, timeout=30))
    assert requests.patch(f"{API}/announcements/{aid}", json={"title": "x"}, headers=admin, timeout=30).status_code == 404
    assert aid in _trash_ids(admin, "announcements")
    requests.post(f"{API}/trash/announcements/{aid}/restore", headers=admin, timeout=30)
    assert aid in _ids(requests.get(f"{API}/announcements", headers=admin, timeout=30))
    requests.delete(f"{API}/announcements/{aid}", headers=admin, timeout=30)
    requests.delete(f"{API}/trash/announcements/{aid}", headers=admin, timeout=30)


def test_material_file_kept_until_purge(admin, class_id):
    r = requests.post(
        f"{API}/materials/upload",
        data={"class_id": class_id, "title": "TEST file"},
        files={"file": ("t.txt", b"hello", "text/plain")},
        headers=admin,
        timeout=30,
    )
    assert r.status_code == 200, r.text
    mat = r.json()
    url = f"{BASE_URL}{mat['file_url']}"
    assert requests.get(url, headers=admin, timeout=30).status_code == 200

    requests.delete(f"{API}/materials/{mat['id']}", headers=admin, timeout=30)
    assert mat["id"] not in _ids(requests.get(f"{API}/materials", headers=admin, timeout=30))
    assert requests.get(url, headers=admin, timeout=30).status_code == 404  # hidden while trashed

    requests.post(f"{API}/trash/materials/{mat['id']}/restore", headers=admin, timeout=30)
    assert requests.get(url, headers=admin, timeout=30).content == b"hello"  # file survived

    requests.delete(f"{API}/materials/{mat['id']}", headers=admin, timeout=30)
    assert requests.delete(f"{API}/trash/materials/{mat['id']}", headers=admin, timeout=30).status_code == 200
    assert requests.get(url, headers=admin, timeout=30).status_code == 404


def test_parent_trash_disables_login_and_restore_relinks(admin, student_id):
    email = f"test_trash_{uuid.uuid4().hex[:8]}@educentre.id"
    r = requests.post(
        f"{API}/parents",
        json={"full_name": "TEST Parent", "email": email, "password": "parent-pass-1", "children_ids": [student_id]},
        headers=admin,
        timeout=30,
    )
    assert r.status_code == 200, r.text
    parent = r.json()
    me = {"Authorization": f"Bearer {_login(email, 'parent-pass-1').json()['access_token']}"}
    assert requests.get(f"{API}/auth/me", headers=me, timeout=30).status_code == 200

    assert requests.delete(f"{API}/parents/{parent['id']}", headers=admin, timeout=30).status_code == 200
    assert parent["id"] not in _ids(requests.get(f"{API}/parents", headers=admin, timeout=30))
    assert parent["id"] in _trash_ids(admin, "parents")
    assert _login(email, "parent-pass-1").status_code == 403
    assert requests.get(f"{API}/auth/me", headers=me, timeout=30).status_code == 401  # old token is dead too
    students = requests.get(f"{API}/students", headers=admin, timeout=30).json()
    assert next(s for s in students if s["id"] == student_id).get("parent_id") is None

    assert requests.post(f"{API}/trash/parents/{parent['id']}/restore", headers=admin, timeout=30).status_code == 200
    assert _login(email, "parent-pass-1").status_code == 200
    students = requests.get(f"{API}/students", headers=admin, timeout=30).json()
    assert next(s for s in students if s["id"] == student_id).get("parent_id") == parent["user_id"]

    requests.delete(f"{API}/parents/{parent['id']}", headers=admin, timeout=30)
    assert requests.delete(f"{API}/trash/parents/{parent['id']}", headers=admin, timeout=30).status_code == 200
    assert _login(email, "parent-pass-1").status_code == 401


def test_trash_is_admin_only_and_validates_type(admin):
    edu = {"Authorization": f"Bearer {_login('fariz@educentre.id', 'educator123').json()['access_token']}"}
    assert requests.get(f"{API}/trash", headers=edu, timeout=30).status_code == 403
    assert requests.post(f"{API}/trash/invoices/x/restore", headers=edu, timeout=30).status_code == 403
    assert requests.delete(f"{API}/trash/invoices/x", headers=edu, timeout=30).status_code == 403
    assert requests.get(f"{API}/trash", params={"type": "bogus"}, headers=admin, timeout=30).status_code == 404
