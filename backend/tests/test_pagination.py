"""Opt-in server-side pagination (F0-8): old list contract unchanged, `paged=true` returns {items,total,limit,skip}."""
import os

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture(scope="module")
def admin():
    return _login("admin@educentre.id", "admin123")


def _get(admin, path, **params):
    r = requests.get(f"{API}{path}", params=params, headers=admin, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.mark.parametrize("path", ["/students", "/invoices", "/payments", "/enrollments", "/grades"])
def test_default_response_is_still_a_plain_list(admin, path):
    assert isinstance(_get(admin, path), list)


@pytest.mark.parametrize("path", ["/students", "/invoices", "/payments", "/enrollments", "/grades"])
def test_paged_shape_and_clamping(admin, path):
    body = _get(admin, path, paged="true", limit=2)
    assert set(body) == {"items", "total", "limit", "skip"}
    assert body["limit"] == 2 and body["skip"] == 0
    assert len(body["items"]) <= 2
    assert body["total"] >= len(body["items"])
    # absurd values are clamped, not rejected
    big = _get(admin, path, paged="true", limit=10**6, skip=-5)
    assert big["limit"] == 200 and big["skip"] == 0


def test_pages_do_not_overlap_and_cover_the_list(admin):
    everything = _get(admin, "/students")
    first = _get(admin, "/students", paged="true", limit=3, skip=0)
    second = _get(admin, "/students", paged="true", limit=3, skip=3)
    assert first["total"] == len(everything)
    ids1 = [s["id"] for s in first["items"]]
    ids2 = [s["id"] for s in second["items"]]
    assert not set(ids1) & set(ids2)


def test_sort_and_search_students(admin):
    asc = _get(admin, "/students", paged="true", limit=50, sort_by="name", dir="asc")["items"]
    names = [s["full_name"] for s in asc]
    assert names == sorted(names)
    desc = _get(admin, "/students", paged="true", limit=50, sort_by="name", dir="desc")["items"]
    assert [s["full_name"] for s in desc] == names[::-1]
    probe = names[0][:3]
    hit = _get(admin, "/students", paged="true", search=probe)
    assert hit["total"] >= 1 and all(probe.lower() in s["full_name"].lower() or probe.lower() in (s.get("email") or "").lower()
                                     or probe.lower() in (s.get("student_code") or "").lower()
                                     or probe.lower() in (s.get("school_name") or "").lower() for s in hit["items"])


def test_search_text_is_literal_not_regex(admin):
    # ".*" would match everything if it were treated as a regex
    assert _get(admin, "/students", paged="true", search=".*")["total"] == 0
    assert _get(admin, "/invoices", paged="true", search="(")["total"] == 0


def test_invoice_status_filter_and_sort(admin):
    body = _get(admin, "/invoices", paged="true", limit=200, sort_by="amount", dir="asc")
    amounts = [i["total_amount"] for i in body["items"]]
    assert amounts == sorted(amounts)
    paid = _get(admin, "/invoices", paged="true", status="paid")
    assert all(i["status"] == "paid" for i in paid["items"])


def test_parent_sees_empty_page_for_other_roles_rule(admin):
    # students/educators have no finance access: paged call keeps the shape
    r = requests.post(f"{API}/auth/login", json={"email": "aiman@educentre.id", "password": "student123"}, timeout=30)
    if r.status_code != 200:
        pytest.skip("demo student account not seeded")
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    body = _get(h, "/invoices", paged="true")
    assert body["items"] == [] and body["total"] == 0


def test_dashboard_aggregates_match_invoice_list(admin):
    stats = _get(admin, "/dashboard/stats")
    invoices = _get(admin, "/invoices")
    outstanding = sum(i.get("balance_due", 0) for i in invoices if i["status"] != "paid")
    overdue = sum(1 for i in invoices if i["status"] == "overdue")
    assert stats["outstanding_fees"] == pytest.approx(outstanding)
    assert stats["overdue_invoices"] == overdue
