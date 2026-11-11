"""announcements routes."""
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user, require_roles
from core import _resolve_educator_id, db, deleted_fields, new_id, not_deleted, now_iso
from models import AnnouncementCreate, AnnouncementUpdate

router = APIRouter()


# ── Announcements ──
@router.post("/announcements")
async def create_announcement(payload: AnnouncementCreate, current=Depends(require_roles("admin", "educator"))):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["created_by"] = current["id"]
    doc["created_by_name"] = current["full_name"]
    doc["created_at"] = now_iso()
    await db.announcements.insert_one(doc)
    doc.pop("_id", None)
    return doc


async def _own_announcement_or_403(aid: str, current: dict) -> dict:
    doc = await db.announcements.find_one(not_deleted({"id": aid}), {"_id": 0})
    if not doc:
        raise HTTPException(404, "Announcement not found")
    if current["role"] != "admin" and doc.get("created_by") != current["id"]:
        raise HTTPException(403, "You can only change your own announcements")
    return doc


@router.patch("/announcements/{aid}")
async def update_announcement(aid: str, payload: AnnouncementUpdate, current=Depends(require_roles("admin", "educator"))):
    await _own_announcement_or_403(aid, current)
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    await db.announcements.update_one({"id": aid}, {"$set": update})
    return await db.announcements.find_one({"id": aid}, {"_id": 0})


@router.delete("/announcements/{aid}")
async def delete_announcement(aid: str, current=Depends(require_roles("admin", "educator"))):
    await _own_announcement_or_403(aid, current)
    await db.announcements.update_one({"id": aid}, {"$set": deleted_fields(current["id"])})
    return {"ok": True}


@router.get("/announcements")
async def list_announcements(current=Depends(get_current_user)):
    role = current["role"]
    role_to_audience = {"admin": ["all"], "educator": ["all", "educators"], "student": ["all", "students"], "parent": ["all", "parents"]}
    audiences = role_to_audience.get(role, ["all"])
    docs = await db.announcements.find(not_deleted({"audience": {"$in": audiences + ["class"]}}), {"_id": 0}).sort("created_at", -1).to_list(200)
    # filter class-specific
    if role in ("student", "educator", "parent"):
        # find class ids the user has access to
        class_ids = set()
        if role == "educator":
            edu_id = await _resolve_educator_id(current["id"])
            cs = await db.classes.find({"educator_id": edu_id}, {"_id": 0, "id": 1}).to_list(50)
            class_ids = {c["id"] for c in cs}
        elif role == "student":
            s = await db.students.find_one({"user_id": current["id"]}, {"_id": 0, "id": 1})
            if s:
                es = await db.enrollments.find({"student_id": s["id"], "status": "active"}, {"_id": 0, "class_id": 1}).to_list(50)
                class_ids = {e["class_id"] for e in es}
        elif role == "parent":
            kids = await db.students.find({"parent_id": current["id"]}, {"_id": 0, "id": 1}).to_list(50)
            es = await db.enrollments.find({"student_id": {"$in": [k["id"] for k in kids]}, "status": "active"}, {"_id": 0, "class_id": 1}).to_list(200)
            class_ids = {e["class_id"] for e in es}
        docs = [d for d in docs if d.get("audience") != "class" or d.get("class_id") in class_ids]
    return docs
