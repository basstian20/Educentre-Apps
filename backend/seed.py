"""Seed script: creates admin + demo educator/parent/student/classes/etc."""
import os
import uuid
from datetime import datetime, timezone, date, timedelta

from auth import hash_password, verify_password


def _id():
    return str(uuid.uuid4())


def _now():
    return datetime.now(timezone.utc).isoformat()


async def seed_all(db):
    # ── Admin ──
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@educentre.id").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    admin = await db.users.find_one({"email": admin_email})
    if not admin:
        await db.users.insert_one({
            "id": _id(),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "full_name": "Sari Dewi (Admin)",
            "role": "admin",
            "phone": "+62 812-1111-1111",
            "is_active": True,
            "created_at": _now(),
        })
    elif not verify_password(admin_password, admin["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

    # If demo data already seeded, skip
    if await db.classes.count_documents({}) > 0:
        return

    # ── Educator ──
    edu_user_id = _id()
    edu_id = _id()
    await db.users.insert_one({
        "id": edu_user_id,
        "email": "fariz@educentre.id",
        "password_hash": hash_password("educator123"),
        "full_name": "Pak Fariz Abdullah",
        "role": "educator",
        "phone": "+62 812-2222-2222",
        "is_active": True,
        "created_at": _now(),
    })
    await db.educators.insert_one({
        "id": edu_id,
        "user_id": edu_user_id,
        "staff_code": "EDU-2026-0001",
        "full_name": "Pak Fariz Abdullah",
        "email": "fariz@educentre.id",
        "phone": "+62 812-2222-2222",
        "subjects": ["Mathematics", "Science"],
        "employment_type": "full_time",
        "qualifications": "B.Sc Mathematics, Universitas Indonesia",
        "status": "active",
        "hire_date": _now(),
        "created_at": _now(),
    })

    edu2_user_id = _id()
    edu2_id = _id()
    await db.users.insert_one({
        "id": edu2_user_id,
        "email": "noor@educentre.id",
        "password_hash": hash_password("educator123"),
        "full_name": "Ustazah Nor Hidayah",
        "role": "educator",
        "phone": "+62 812-3333-3333",
        "is_active": True,
        "created_at": _now(),
    })
    await db.educators.insert_one({
        "id": edu2_id,
        "user_id": edu2_user_id,
        "staff_code": "EDU-2026-0002",
        "full_name": "Ustazah Nor Hidayah",
        "email": "noor@educentre.id",
        "phone": "+62 812-3333-3333",
        "subjects": ["English", "Bahasa Indonesia"],
        "employment_type": "full_time",
        "qualifications": "B.Ed English Literature",
        "status": "active",
        "hire_date": _now(),
        "created_at": _now(),
    })

    # ── Parent ──
    parent_user_id = _id()
    parent_id = _id()
    await db.users.insert_one({
        "id": parent_user_id,
        "email": "ibu.nur@educentre.id",
        "password_hash": hash_password("parent123"),
        "full_name": "Ibu Nurhayati",
        "role": "parent",
        "phone": "+62 812-4444-4444",
        "is_active": True,
        "created_at": _now(),
    })
    await db.parents.insert_one({
        "id": parent_id,
        "user_id": parent_user_id,
        "full_name": "Ibu Nurhayati",
        "email": "ibu.nur@educentre.id",
        "phone": "+62 812-4444-4444",
        "occupation": "Marketing Manager",
        "children_ids": [],
        "created_at": _now(),
    })

    # ── Students (2) ──
    students = []
    student_specs = [
        {
            "name": "Aiman Haziq bin Rosli",
            "email": "aiman@educentre.id",
            "year": "Year 5",
            "school": "SD Pelita Bangsa",
            "code": "SC-2026-0001",
            "phone": "+62 812-5555-0001",
            "dob": "2014-03-12",
        },
        {
            "name": "Nurul Ain binti Rosli",
            "email": "nurul@educentre.id",
            "year": "Year 3",
            "school": "SD Pelita Bangsa",
            "code": "SC-2026-0002",
            "phone": "+62 812-5555-0002",
            "dob": "2016-08-04",
        },
    ]
    for spec in student_specs:
        s_user_id = _id()
        s_id = _id()
        await db.users.insert_one({
            "id": s_user_id,
            "email": spec["email"],
            "password_hash": hash_password("student123"),
            "full_name": spec["name"],
            "role": "student",
            "phone": spec["phone"],
            "is_active": True,
            "created_at": _now(),
        })
        student_doc = {
            "id": s_id,
            "user_id": s_user_id,
            "student_code": spec["code"],
            "full_name": spec["name"],
            "email": spec["email"],
            "phone": spec["phone"],
            "dob": spec["dob"],
            "gender": "male" if "bin" in spec["name"] else "female",
            "school_name": spec["school"],
            "school_year": spec["year"],
            "address": "Jl. Mawar No. 12, Jakarta Selatan",
            "parent_id": parent_user_id,
            "medical_notes": None,
            "status": "active",
            "enrolled_at": _now(),
            "created_at": _now(),
        }
        await db.students.insert_one(student_doc)
        students.append(student_doc)

    await db.parents.update_one({"id": parent_id}, {"$set": {"children_ids": [s["id"] for s in students]}})

    # ── Classes ──
    classes = []
    class_specs = [
        {"subject": "Mathematics Year 5", "level": "Year 5", "edu": edu_id, "room": "Room A", "color": "#3B82F6", "fee": 650000, "days": [1, 3], "start": "08:00", "end": "09:30"},
        {"subject": "English Year 3", "level": "Year 3", "edu": edu2_id, "room": "Room B", "color": "#10B981", "fee": 550000, "days": [2, 4], "start": "10:00", "end": "11:30"},
        {"subject": "Science Year 5", "level": "Year 5", "edu": edu_id, "room": "Lab 1", "color": "#F59E0B", "fee": 700000, "days": [6], "start": "09:00", "end": "11:00"},
        {"subject": "Mathematics Year 3", "level": "Year 3", "edu": edu_id, "room": "Room A", "color": "#7C3AED", "fee": 600000, "days": [2, 5], "start": "14:00", "end": "15:30"},
    ]
    for spec in class_specs:
        c = {
            "id": _id(),
            "subject_name": spec["subject"],
            "level": spec["level"],
            "educator_id": spec["edu"],
            "room": spec["room"],
            "description": f"{spec['subject']} weekly session",
            "color_hex": spec["color"],
            "capacity": 20,
            "fee_amount": spec["fee"],
            "schedule_days": spec["days"],
            "time_start": spec["start"],
            "time_end": spec["end"],
            "is_active": True,
            "created_at": _now(),
        }
        await db.classes.insert_one(c)
        classes.append(c)

    # ── Enrollments ── student 1 -> Math Y5 + Sci Y5 ; student 2 -> English Y3 + Math Y3
    enroll_map = [
        (students[0]["id"], classes[0]["id"]),
        (students[0]["id"], classes[2]["id"]),
        (students[1]["id"], classes[1]["id"]),
        (students[1]["id"], classes[3]["id"]),
    ]
    for sid, cid in enroll_map:
        await db.enrollments.insert_one({
            "id": _id(),
            "student_id": sid,
            "class_id": cid,
            "status": "active",
            "enrolled_at": _now(),
        })

    # ── Invoices (October billing for both students) ──
    today = date.today()
    due = (today + timedelta(days=10)).isoformat()
    overdue_due = (today - timedelta(days=5)).isoformat()

    inv_count = 0
    for s_idx, student in enumerate(students):
        inv_count += 1
        items = []
        s_class_ids = [pair[1] for pair in enroll_map if pair[0] == student["id"]]
        for cid in s_class_ids:
            klass = next(c for c in classes if c["id"] == cid)
            items.append({"description": f"Monthly tuition — {klass['subject_name']}", "amount": klass["fee_amount"]})
        subtotal = sum(i["amount"] for i in items)
        await db.invoices.insert_one({
            "id": _id(),
            "invoice_number": f"INV-2026-{inv_count:05d}",
            "student_id": student["id"],
            "billing_month": today.strftime("%Y-%m"),
            "items": items,
            "subtotal": subtotal,
            "discount_amount": 0,
            "tax_amount": 0,
            "total_amount": subtotal,
            "amount_paid": 0,
            "balance_due": subtotal,
            "due_date": due,
            "status": "unpaid",
            "notes": None,
            "created_at": _now(),
        })

    # ── Sample assessment with grades for Math Y5 ──
    math_class = classes[0]
    a_id = _id()
    await db.assessments.insert_one({
        "id": a_id,
        "class_id": math_class["id"],
        "name": "Mid-Year Examination",
        "type": "test",
        "assessment_date": today.isoformat(),
        "max_score": 100,
        "pass_score": 50,
        "weightage": 30,
        "is_published": True,
        "published_at": _now(),
        "created_by": edu_user_id,
        "created_at": _now(),
    })
    await db.grades.insert_one({
        "id": _id(),
        "assessment_id": a_id,
        "student_id": students[0]["id"],
        "score": 84,
        "remark": "Good effort, well done!",
        "is_absent": False,
        "max_score": 100,
        "percentage": 84.0,
        "letter_grade": "A-",
        "is_passed": True,
        "entered_by": edu_user_id,
        "entered_at": _now(),
    })

    # ── Sample materials ──
    await db.materials.insert_one({
        "id": _id(),
        "class_id": math_class["id"],
        "title": "Math Year 5 — Chapter 6 Notes",
        "type": "link",
        "external_url": "https://example.com/math-notes-ch6",
        "file_url": None,
        "description": "Notes covering fractions and decimals.",
        "uploaded_by": edu_user_id,
        "uploader_name": "Pak Fariz Abdullah",
        "created_at": _now(),
    })

    # ── Announcements ──
    await db.announcements.insert_one({
        "id": _id(),
        "title": "Welcome to EduCentre!",
        "body": "We're excited to launch our new digital management system. Reach out to admin for any questions.",
        "audience": "all",
        "class_id": None,
        "created_by": "system",
        "created_by_name": "EduCentre Admin",
        "created_at": _now(),
    })

    # ── Sample attendance for last week (math Y5) ──
    for d_offset in range(1, 14):
        sess_date = (today - timedelta(days=d_offset)).isoformat()
        # only on Mon/Wed
        if (today - timedelta(days=d_offset)).isoweekday() not in [1, 3]:
            continue
        for s in students[:1]:
            await db.attendance.insert_one({
                "id": _id(),
                "class_id": math_class["id"],
                "session_date": sess_date,
                "student_id": s["id"],
                "status": "present",
                "note": None,
                "marked_by": edu_user_id,
                "marked_at": _now(),
            })

    # ── Save credentials file ──
    creds_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "memory", "test_credentials.md")
    os.makedirs(os.path.dirname(creds_path), exist_ok=True)
    with open(creds_path, "w") as f:
        f.write("""# EduCentre Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@educentre.id | admin123 |
| Educator (Math/Sci) | fariz@educentre.id | educator123 |
| Educator (English) | noor@educentre.id | educator123 |
| Parent | ibu.nur@educentre.id | parent123 |
| Student (Aiman, Y5) | aiman@educentre.id | student123 |
| Student (Nurul, Y3) | nurul@educentre.id | student123 |

## Auth Endpoints
- POST `/api/auth/login` — { email, password }
- POST `/api/auth/logout`
- GET `/api/auth/me`
- POST `/api/auth/register` (admin-only)

## Notes
- Auth uses httpOnly cookies + Bearer token (response also returns access_token).
- Demo seed inserts 2 students, 2 educators, 1 parent, 4 classes, 2 invoices, 1 assessment+grade, sample attendance, 1 material, 1 announcement.
""")
