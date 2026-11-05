"""students routes."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user, hash_password, require_roles
from core import _gen_student_code, _resolve_educator_id, _sync_user, db, new_id, now_iso
from models import StudentCreate, StudentImport, StudentUpdate

router = APIRouter()


# ── Students ──
@router.post("/students")
async def create_student(payload: StudentCreate, current=Depends(require_roles("admin"))):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already exists")

    user_id = new_id()
    student_id = new_id()
    code = await _gen_student_code()

    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name,
        "role": "student",
        "phone": payload.phone,
        "is_active": True,
        "created_at": now_iso(),
    }
    student_doc = {
        "id": student_id,
        "user_id": user_id,
        "student_code": code,
        "full_name": payload.full_name,
        "email": email,
        "phone": payload.phone,
        "dob": payload.dob,
        "gender": payload.gender,
        "school_name": payload.school_name,
        "school_year": payload.school_year,
        "address": payload.address,
        "parent_id": payload.parent_id,
        "medical_notes": payload.medical_notes,
        "status": "active",
        "enrolled_at": now_iso(),
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    await db.students.insert_one(student_doc)
    student_doc.pop("_id", None)
    return student_doc


@router.post("/students/import")
async def import_students(payload: StudentImport, current=Depends(require_roles("admin"))):
    """Bulk-create students. Rows that fail are reported back; the rest are still created."""
    created = 0
    errors = []
    seen = set()
    for idx, row in enumerate(payload.rows, start=1):
        email = (row.email or "").lower().strip()
        name = (row.full_name or "").strip()
        if not name or "@" not in email:
            errors.append({"row": idx, "email": email, "reason": "Name and a valid email are required"})
            continue
        if email in seen or await db.users.find_one({"email": email}):
            errors.append({"row": idx, "email": email, "reason": "Email already exists"})
            continue
        seen.add(email)
        user_id = new_id()
        await db.users.insert_one({
            "id": user_id,
            "email": email,
            "password_hash": hash_password("student123"),
            "full_name": name,
            "role": "student",
            "phone": row.phone,
            "is_active": True,
            "created_at": now_iso(),
        })
        await db.students.insert_one({
            "id": new_id(),
            "user_id": user_id,
            "student_code": await _gen_student_code(),
            "full_name": name,
            "email": email,
            "phone": row.phone,
            "dob": row.dob,
            "school_name": row.school_name,
            "school_year": row.school_year,
            "status": "active",
            "enrolled_at": now_iso(),
            "created_at": now_iso(),
        })
        created += 1
    return {"created": created, "errors": errors}


@router.get("/students")
async def list_students(search: Optional[str] = None, status: Optional[str] = None, current=Depends(get_current_user)):
    role = current["role"]
    q = {}
    if role == "student":
        q["user_id"] = current["id"]
    elif role == "parent":
        q["parent_id"] = current["id"]
    elif role == "educator":
        # educators see students from their classes
        edu_id = await _resolve_educator_id(current["id"])
        my_classes = await db.classes.find({"educator_id": edu_id}, {"_id": 0, "id": 1}).to_list(500)
        class_ids = [c["id"] for c in my_classes]
        enrollments = await db.enrollments.find({"class_id": {"$in": class_ids}, "status": "active"}, {"_id": 0, "student_id": 1}).to_list(2000)
        student_ids = list({e["student_id"] for e in enrollments})
        q["id"] = {"$in": student_ids}

    if status:
        q["status"] = status
    if search:
        q["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"student_code": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    students = await db.students.find(q, {"_id": 0}).to_list(500)
    return students


@router.get("/students/{sid}")
async def get_student(sid: str, current=Depends(get_current_user)):
    student = await db.students.find_one({"id": sid}, {"_id": 0})
    if not student:
        raise HTTPException(404, "Student not found")
    return student


@router.patch("/students/{sid}")
async def update_student(sid: str, payload: StudentUpdate, current=Depends(require_roles("admin"))):
    student = await db.students.find_one({"id": sid}, {"_id": 0})
    if not student:
        raise HTTPException(404, "Student not found")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    await db.students.update_one({"id": sid}, {"$set": update})
    await _sync_user(student.get("user_id"), update)
    return await db.students.find_one({"id": sid}, {"_id": 0})


@router.delete("/students/{sid}")
async def deactivate_student(sid: str, current=Depends(require_roles("admin"))):
    """Soft delete: keeps attendance, grades and invoices, blocks login."""
    student = await db.students.find_one({"id": sid}, {"_id": 0})
    if not student:
        raise HTTPException(404, "Student not found")
    await db.students.update_one({"id": sid}, {"$set": {"status": "inactive", "updated_at": now_iso()}})
    await _sync_user(student.get("user_id"), {"status": "inactive"})
    return {"ok": True}
