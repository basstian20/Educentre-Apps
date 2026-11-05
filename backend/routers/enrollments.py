"""enrollments routes."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user, require_roles
from core import _resolve_educator_id, _resolve_student_id, db, new_id, now_iso
from models import EnrollmentCreate

router = APIRouter()


# ── Enrollment ──
@router.post("/enrollments")
async def create_enrollment(payload: EnrollmentCreate, current=Depends(require_roles("admin"))):
    existing = await db.enrollments.find_one({"student_id": payload.student_id, "class_id": payload.class_id, "status": "active"})
    if existing:
        raise HTTPException(400, "Already enrolled in this class")
    klass = await db.classes.find_one({"id": payload.class_id})
    if not klass:
        raise HTTPException(404, "Class not found")
    count = await db.enrollments.count_documents({"class_id": payload.class_id, "status": "active"})
    if count >= klass.get("capacity", 99):
        raise HTTPException(400, "Class is full")
    doc = {
        "id": new_id(),
        "student_id": payload.student_id,
        "class_id": payload.class_id,
        "status": "active",
        "enrolled_at": now_iso(),
        "enrolled_by": current["id"],
    }
    await db.enrollments.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/enrollments")
async def list_enrollments(student_id: Optional[str] = None, class_id: Optional[str] = None, current=Depends(get_current_user)):
    q = {}
    role = current["role"]
    if role == "student":
        sid = await _resolve_student_id(current["id"])
        q["student_id"] = sid
    elif role == "parent":
        kids = await db.students.find({"parent_id": current["id"]}, {"_id": 0, "id": 1}).to_list(50)
        q["student_id"] = {"$in": [k["id"] for k in kids]}
    elif role == "educator":
        edu_id = await _resolve_educator_id(current["id"])
        my_cids = [c["id"] for c in await db.classes.find({"educator_id": edu_id}, {"_id": 0, "id": 1}).to_list(200)]
        q["class_id"] = {"$in": my_cids}
    if student_id and role == "admin":
        q["student_id"] = student_id
    if class_id and role in ("admin", "educator"):
        q["class_id"] = class_id
    return await db.enrollments.find(q, {"_id": 0}).to_list(500)


@router.delete("/enrollments/{eid}")
async def withdraw_enrollment(eid: str, current=Depends(require_roles("admin"))):
    await db.enrollments.update_one({"id": eid}, {"$set": {"status": "withdrawn", "withdrawn_at": now_iso()}})
    return {"ok": True}
