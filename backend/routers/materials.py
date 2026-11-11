"""materials routes."""
from typing import Optional
from fastapi import APIRouter, Depends
from auth import get_current_user, require_roles
from core import _resolve_educator_id, db, deleted_fields, new_id, not_deleted, now_iso
from models import MaterialCreate

router = APIRouter()


# ── Materials ──
@router.post("/materials")
async def create_material(payload: MaterialCreate, current=Depends(require_roles("admin", "educator"))):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["uploaded_by"] = current["id"]
    doc["uploader_name"] = current["full_name"]
    doc["created_at"] = now_iso()
    await db.materials.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/materials")
async def list_materials(class_id: Optional[str] = None, current=Depends(get_current_user)):
    q = not_deleted()
    role = current["role"]
    if class_id:
        q["class_id"] = class_id
    elif role == "student":
        s = await db.students.find_one({"user_id": current["id"]}, {"_id": 0, "id": 1})
        if not s:
            return []
        enrolls = await db.enrollments.find({"student_id": s["id"], "status": "active"}, {"_id": 0, "class_id": 1}).to_list(50)
        q["class_id"] = {"$in": [e["class_id"] for e in enrolls]}
    elif role == "parent":
        kids = await db.students.find({"parent_id": current["id"]}, {"_id": 0, "id": 1}).to_list(50)
        enrolls = await db.enrollments.find({"student_id": {"$in": [k["id"] for k in kids]}, "status": "active"}, {"_id": 0, "class_id": 1}).to_list(200)
        q["class_id"] = {"$in": list({e["class_id"] for e in enrolls})}
    elif role == "educator":
        edu_id = await _resolve_educator_id(current["id"])
        my_classes = await db.classes.find({"educator_id": edu_id}, {"_id": 0, "id": 1}).to_list(50)
        q["class_id"] = {"$in": [c["id"] for c in my_classes]}
    return await db.materials.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)


@router.delete("/materials/{mid}")
async def delete_material(mid: str, current=Depends(require_roles("admin", "educator"))):
    # the file stays in storage until the material is purged from the trash
    await db.materials.update_one(not_deleted({"id": mid}), {"$set": deleted_fields(current["id"])})
    return {"ok": True}
