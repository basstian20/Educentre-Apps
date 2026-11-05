"""attendance routes."""
from typing import Optional
from fastapi import APIRouter, Depends
from auth import get_current_user, require_roles
from core import _resolve_educator_id, db, new_id, now_iso
from models import AttendanceMark
from routers.invoices import _visible_student_ids

router = APIRouter()


# ── Attendance ──
@router.post("/attendance")
async def mark_attendance(payload: AttendanceMark, current=Depends(require_roles("admin", "educator"))):
    # remove existing for same class+date and insert fresh
    await db.attendance.delete_many({"class_id": payload.class_id, "session_date": payload.session_date})
    docs = []
    for r in payload.records:
        docs.append({
            "id": new_id(),
            "class_id": payload.class_id,
            "session_date": payload.session_date,
            "student_id": r["student_id"],
            "status": r.get("status", "present"),
            "note": r.get("note"),
            "marked_by": current["id"],
            "marked_at": now_iso(),
        })
    if docs:
        await db.attendance.insert_many(docs)
    for d in docs:
        d.pop("_id", None)
    return {"count": len(docs), "records": docs}


ATTENDANCE_DEFAULT_LIMIT = 200
ATTENDANCE_MAX_LIMIT = 500


@router.get("/attendance")
async def list_attendance(
    class_id: Optional[str] = None,
    student_id: Optional[str] = None,
    session_date: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = ATTENDANCE_DEFAULT_LIMIT,
    skip: int = 0,
    current=Depends(get_current_user),
):
    """Paged attendance history, newest first. Returns {items, total, limit, skip}.

    Each role only sees its own scope: students and parents their children,
    educators their own classes, admin everything.
    """
    limit = max(1, min(limit, ATTENDANCE_MAX_LIMIT))
    skip = max(0, skip)
    filters = []
    if class_id:
        filters.append({"class_id": class_id})
    if student_id:
        filters.append({"student_id": student_id})
    if session_date:
        filters.append({"session_date": session_date})
    if date_from:
        filters.append({"session_date": {"$gte": date_from}})
    if date_to:
        filters.append({"session_date": {"$lte": date_to}})

    role = current["role"]
    if role == "educator":
        edu_id = await _resolve_educator_id(current["id"])
        mine = await db.classes.find({"educator_id": edu_id}, {"_id": 0, "id": 1}).to_list(500)
        filters.append({"class_id": {"$in": [c["id"] for c in mine]}})
    elif role != "admin":
        visible = await _visible_student_ids(current)
        filters.append({"student_id": {"$in": list(visible or [])}})
    q = {"$and": filters} if filters else {}

    total = await db.attendance.count_documents(q)
    records = await (
        db.attendance.find(q, {"_id": 0})
        .sort([("session_date", -1), ("class_id", 1), ("student_id", 1)])
        .skip(skip)
        .limit(limit)
        .to_list(limit)
    )

    student_ids = list({r["student_id"] for r in records})
    students = await db.students.find(
        {"id": {"$in": student_ids}}, {"_id": 0, "id": 1, "full_name": 1}
    ).to_list(len(student_ids) or 1)
    student_map = {s["id"]: s["full_name"] for s in students}
    for r in records:
        r["student_name"] = student_map.get(r["student_id"], "—")

    return {"items": records, "total": total, "limit": limit, "skip": skip}
