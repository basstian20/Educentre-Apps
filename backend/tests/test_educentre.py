"""EduCentre comprehensive backend test suite."""
import os
import pytest
import requests
from datetime import date, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://educentre-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

CREDS = {
    "admin": ("admin@educentre.id", "admin123"),
    "educator": ("fariz@educentre.id", "educator123"),
    "student": ("aiman@educentre.id", "student123"),
    "parent": ("ibu.nur@educentre.id", "parent123"),
}


def _login(role):
    email, password = CREDS[role]
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=20)
    assert r.status_code == 200, f"{role} login failed: {r.status_code} {r.text}"
    data = r.json()
    return data["access_token"], data["user"]


def _client(token=None):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="session")
def tokens():
    t = {}
    for role in CREDS:
        token, user = _login(role)
        t[role] = {"token": token, "user": user}
    return t


@pytest.fixture
def admin(tokens):
    return _client(tokens["admin"]["token"])


@pytest.fixture
def educator(tokens):
    return _client(tokens["educator"]["token"])


@pytest.fixture
def student(tokens):
    return _client(tokens["student"]["token"])


@pytest.fixture
def parent(tokens):
    return _client(tokens["parent"]["token"])


# ── Auth ──
class TestAuth:
    def test_login_all_roles(self, tokens):
        for role in ["admin", "educator", "student", "parent"]:
            assert tokens[role]["token"]
            assert tokens[role]["user"]["role"] == role

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": "admin@educentre.id", "password": "wrong"})
        assert r.status_code == 401

    def test_me_authenticated(self, admin):
        r = admin.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_me_unauthenticated(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_logout(self, admin):
        r = admin.post(f"{API}/auth/logout")
        assert r.status_code == 200


# ── Dashboard stats ──
class TestDashboard:
    def test_admin_stats(self, admin):
        r = admin.get(f"{API}/dashboard/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ["active_students", "active_classes", "revenue_this_month", "outstanding_fees"]:
            assert k in d, f"Missing key {k}"

    def test_educator_stats(self, educator):
        r = educator.get(f"{API}/dashboard/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ["my_classes", "total_students", "pending_assessments", "today_classes"]:
            assert k in d

    def test_student_stats(self, student):
        r = student.get(f"{API}/dashboard/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ["active_classes", "attendance_pct", "outstanding_fees"]:
            assert k in d

    def test_parent_stats(self, parent):
        r = parent.get(f"{API}/dashboard/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ["children_count", "children", "attendance_pct"]:
            assert k in d


# ── Students ──
class TestStudents:
    def test_admin_list_students(self, admin):
        r = admin.get(f"{API}/students")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_student_self_only(self, student):
        r = student.get(f"{API}/students")
        assert r.status_code == 200
        # Student should only see themselves
        students = r.json()
        assert len(students) <= 1

    def test_parent_sees_kids(self, parent):
        r = parent.get(f"{API}/students")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_create_student_admin(self, admin):
        import uuid as _u
        unique = _u.uuid4().hex[:8]
        payload = {
            "email": f"TEST_student_{unique}@educentre.id",
            "password": "test123",
            "full_name": "TEST Student One",
            "phone": "+6281234567890",
            "school_year": "Y4",
        }
        r = admin.post(f"{API}/students", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"].lower() == payload["email"].lower()
        assert data["student_code"].startswith("SC-")
        # GET verify
        sid = data["id"]
        g = admin.get(f"{API}/students/{sid}")
        assert g.status_code == 200
        assert g.json()["full_name"] == payload["full_name"]

    def test_rbac_student_create_forbidden(self, educator):
        r = educator.post(f"{API}/students", json={
            "email": "TEST_x@x.com", "password": "x", "full_name": "X"
        })
        assert r.status_code == 403


# ── Educators ──
class TestEducators:
    def test_list_educators(self, admin):
        r = admin.get(f"{API}/educators")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_rbac_create_educator(self, student):
        r = student.post(f"{API}/educators", json={
            "email": "TEST_e@e.com", "password": "x", "full_name": "X", "subjects": ["Math"], "employment_type": "full_time"
        })
        assert r.status_code == 403


# ── Parents ──
class TestParents:
    def test_admin_list_parents(self, admin):
        r = admin.get(f"{API}/parents")
        assert r.status_code == 200

    def test_parent_role_forbidden(self, parent):
        r = parent.get(f"{API}/parents")
        assert r.status_code == 403


# ── Classes ──
class TestClasses:
    def test_list_classes(self, admin):
        r = admin.get(f"{API}/classes")
        assert r.status_code == 200
        cls = r.json()
        assert len(cls) >= 1
        assert "enrolled_count" in cls[0]

    def test_educator_classes_filtered(self, educator):
        r = educator.get(f"{API}/classes")
        assert r.status_code == 200
        cls = r.json()
        # Retest fix: educator fariz should see at least 3 classes (Math Y5, Sci Y5, Math Y3)
        assert len(cls) >= 3, f"Educator should see >=3 classes, got {len(cls)}"
        subjects = {c.get("subject_name") for c in cls}
        assert any("Mathematics" in (s or "") for s in subjects) or any("Science" in (s or "") for s in subjects), f"Unexpected subjects: {subjects}"

    def test_educator_dashboard_stats_nonzero(self, educator):
        r = educator.get(f"{API}/dashboard/stats")
        assert r.status_code == 200
        d = r.json()
        assert d["my_classes"] >= 3, f"my_classes={d['my_classes']}"
        assert d["total_students"] >= 3, f"total_students={d['total_students']}"

    def test_rbac_create_class(self, educator):
        r = educator.post(f"{API}/classes", json={
            "name": "x", "subject": "Math", "level": "Y4",
            "educator_id": "x", "schedule_days": [1], "start_time": "10:00",
            "end_time": "11:00", "capacity": 10, "monthly_fee": 100000, "start_date": "2026-01-01"
        })
        assert r.status_code == 403


# ── Enrollments ──
class TestEnrollments:
    def test_list_enrollments(self, admin):
        r = admin.get(f"{API}/enrollments")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_enrollments_role_filtered_student(self, student, tokens, admin):
        r = student.get(f"{API}/enrollments")
        assert r.status_code == 200
        enrolls = r.json()
        # Student should only see their own enrollments
        # Get own student record via admin
        all_students = admin.get(f"{API}/students").json()
        me = next((s for s in all_students if s.get("email", "").lower() == tokens["student"]["user"]["email"].lower()), None)
        if me and enrolls:
            for e in enrolls:
                assert e["student_id"] == me["id"], f"Student saw other student's enrollment: {e}"

    def test_enrollments_role_filtered_parent(self, parent):
        r = parent.get(f"{API}/enrollments")
        assert r.status_code == 200
        # Parent should see only their children's enrollments (subset — not full admin list)

    def test_enrollments_role_filtered_educator(self, educator):
        r = educator.get(f"{API}/enrollments")
        assert r.status_code == 200
        # Educator should only see enrollments for their classes
        cls_ids = {c["id"] for c in educator.get(f"{API}/classes").json()}
        for e in r.json():
            assert e["class_id"] in cls_ids, f"Educator saw out-of-scope enrollment: {e}"


# ── Attendance ──
class TestAttendance:
    def test_list_attendance(self, admin):
        r = admin.get(f"{API}/attendance")
        assert r.status_code == 200

    def test_mark_attendance_educator(self, educator, admin):
        # Get a class for the educator
        r = educator.get(f"{API}/classes")
        classes = r.json()
        if not classes:
            pytest.skip("Educator has no classes")
        cid = classes[0]["id"]
        # get students enrolled
        en = admin.get(f"{API}/enrollments", params={"class_id": cid}).json()
        if not en:
            pytest.skip("No enrollments in class")
        sid = en[0]["student_id"]
        d = date.today().isoformat()
        payload = {"class_id": cid, "session_date": d, "records": [{"student_id": sid, "status": "present"}]}
        r = educator.post(f"{API}/attendance", json=payload)
        assert r.status_code == 200, r.text
        assert r.json()["count"] == 1


# ── Invoices & Payments ──
class TestInvoices:
    def test_list_invoices_admin(self, admin):
        r = admin.get(f"{API}/invoices")
        assert r.status_code == 200

    def test_parent_sees_kids_invoices(self, parent):
        r = parent.get(f"{API}/invoices")
        assert r.status_code == 200

    def test_create_invoice_and_payment(self, admin):
        # Pick first student
        s = admin.get(f"{API}/students").json()[0]
        payload = {
            "student_id": s["id"],
            "billing_month": "2026-02",
            "items": [{"description": "TEST Tuition Feb", "amount": 500000}],
            "due_date": (date.today() + timedelta(days=14)).isoformat(),
            "notes": "TEST_invoice"
        }
        r = admin.post(f"{API}/invoices", json=payload)
        assert r.status_code == 200, r.text
        inv = r.json()
        assert inv["balance_due"] == 500000
        assert inv["invoice_number"].startswith("INV-")
        assert inv["status"] == "unpaid"
        iid = inv["id"]
        # Make partial payment
        p = admin.post(f"{API}/payments", json={
            "invoice_id": iid, "amount": 200000, "method": "bank_transfer"
        })
        assert p.status_code == 200
        # Check invoice updated
        inv2 = admin.get(f"{API}/invoices/{iid}").json()
        assert inv2["amount_paid"] == 200000
        assert inv2["status"] == "partial"
        # Pay rest
        admin.post(f"{API}/payments", json={
            "invoice_id": iid, "amount": 300000, "method": "cash"
        })
        inv3 = admin.get(f"{API}/invoices/{iid}").json()
        assert inv3["status"] == "paid"
        assert inv3["balance_due"] == 0

    def test_educator_no_invoices(self, educator):
        r = educator.get(f"{API}/invoices")
        assert r.status_code == 200
        assert r.json() == []

    def test_payment_rbac_non_admin_forbidden(self, educator, student, parent, admin):
        # Create a test invoice first
        s = admin.get(f"{API}/students").json()[0]
        inv_r = admin.post(f"{API}/invoices", json={
            "student_id": s["id"],
            "billing_month": "2026-03",
            "items": [{"description": "TEST RBAC Invoice", "amount": 100000}],
            "due_date": (date.today() + timedelta(days=14)).isoformat(),
        })
        assert inv_r.status_code == 200, inv_r.text
        iid = inv_r.json()["id"]
        payload = {"invoice_id": iid, "amount": 50000, "method": "cash"}
        # Educator, student, parent all must get 403
        for cli_name, cli in [("educator", educator), ("student", student), ("parent", parent)]:
            r = cli.post(f"{API}/payments", json=payload)
            assert r.status_code == 403, f"{cli_name} got {r.status_code}, expected 403"

    def test_invoice_overdue_persisted(self, admin):
        s = admin.get(f"{API}/students").json()[0]
        past_due = (date.today() - timedelta(days=5)).isoformat()
        r = admin.post(f"{API}/invoices", json={
            "student_id": s["id"],
            "billing_month": "2025-11",
            "items": [{"description": "TEST Overdue", "amount": 250000}],
            "due_date": past_due,
            "notes": "TEST_overdue"
        })
        assert r.status_code == 200, r.text
        iid = r.json()["id"]
        # Calling list triggers update_many → status becomes overdue
        admin.get(f"{API}/invoices")
        got = admin.get(f"{API}/invoices/{iid}").json()
        assert got["status"] == "overdue", f"Expected overdue, got {got['status']}"


# ── Assessments & Grades ──
class TestAssessments:
    def test_list_assessments(self, admin):
        r = admin.get(f"{API}/assessments")
        assert r.status_code == 200

    def test_assessment_grade_publish_flow(self, educator, admin):
        # find a class for educator
        cls = educator.get(f"{API}/classes").json()
        if not cls:
            pytest.skip("No classes for educator")
        cid = cls[0]["id"]
        # create assessment
        a_payload = {
            "class_id": cid,
            "name": "TEST Quiz",
            "type": "quiz",
            "max_score": 100,
            "pass_score": 50,
            "weightage": 10,
            "assessment_date": date.today().isoformat(),
        }
        r = educator.post(f"{API}/assessments", json=a_payload)
        assert r.status_code == 200, r.text
        aid = r.json()["id"]
        # students in class
        en = admin.get(f"{API}/enrollments", params={"class_id": cid}).json()
        if not en:
            pytest.skip("No enrolled students")
        sid = en[0]["student_id"]
        # save grades
        g = educator.post(f"{API}/grades", json={
            "assessment_id": aid,
            "entries": [{"student_id": sid, "score": 85.0}]
        })
        assert g.status_code == 200
        # student shouldn't see unpublished grades
        # publish
        p = educator.post(f"{API}/assessments/publish", json={"assessment_id": aid})
        assert p.status_code == 200
        # list grades
        gl = admin.get(f"{API}/grades", params={"assessment_id": aid}).json()
        assert len(gl) == 1
        assert gl[0]["letter_grade"] == "A-"
        assert gl[0]["percentage"] == 85.0


# ── Materials ──
class TestMaterials:
    def test_list_materials(self, admin):
        r = admin.get(f"{API}/materials")
        assert r.status_code == 200


# ── Announcements ──
class TestAnnouncements:
    def test_list_announcements_all(self, admin):
        r = admin.get(f"{API}/announcements")
        assert r.status_code == 200

    def test_student_announcements(self, student):
        r = student.get(f"{API}/announcements")
        assert r.status_code == 200
