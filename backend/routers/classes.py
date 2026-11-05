"""classes routes."""
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user, require_roles
from core import _resolve_educator_id, db, new_id, now_iso
from models import ClassCreate, ClassUpdate

router = APIRouter()


# ── Classes ──
@router.post("/classes")
async def create_class(payload: ClassCreate, current=Depends(require_roles("admin"))):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["is_active"] = True
    doc["created_at"] = now_iso()
    await db.classes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/classes")
async def list_classes(current=Depends(get_current_user)):
    role = current["role"]
    q = {"is_active": True}
    classes = await db.classes.find(q, {"_id": 0}).to_list(500)
    if role == "educator":
        edu_id = await _resolve_educator_id(current["id"])
        classes = [c for c in classes if c.get("educator_id") == edu_id]
    elif role == "student":
        student = await db.students.find_one({"user_id": current["id"]}, {"_id": 0, "id": 1})
        if not student:
            return []
        enrolls = await db.enrollments.find({"student_id": student["id"], "status": "active"}, {"_id": 0, "class_id": 1}).to_list(200)
        cids = [e["class_id"] for e in enrolls]
        classes = [c for c in classes if c["id"] in cids]
    elif role == "parent":
        kids = await db.students.find({"parent_id": current["id"]}, {"_id": 0, "id": 1, "full_name": 1}).to_list(50)
        kid_names = {k["id"]: k["full_name"] for k in kids}
        enrolls = await db.enrollments.find({"student_id": {"$in": list(kid_names)}, "status": "active"}, {"_id": 0, "class_id": 1, "student_id": 1}).to_list(500)
        children_by_class = {}
        for e in enrolls:
            children_by_class.setdefault(e["class_id"], []).append(kid_names[e["student_id"]])
        classes = [c for c in classes if c["id"] in children_by_class]
        for c in classes:
            c["child_names"] = sorted(set(children_by_class[c["id"]]))
    # enrich educator name + enrolled count
    edu_ids = list({c.get("educator_id") for c in classes if c.get("educator_id")})
    edus = await db.educators.find({"id": {"$in": edu_ids}}, {"_id": 0, "id": 1, "full_name": 1}).to_list(500)
    edu_map = {e["id"]: e["full_name"] for e in edus}
    for c in classes:
        c["educator_name"] = edu_map.get(c.get("educator_id"), "—")
        c["enrolled_count"] = await db.enrollments.count_documents({"class_id": c["id"], "status": "active"})
    return classes


@router.get("/classes/{cid}")
async def get_class(cid: str, current=Depends(get_current_user)):
    c = await db.classes.find_one({"id": cid}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Class not found")
    return c


@router.patch("/classes/{cid}")
async def update_class(cid: str, payload: ClassUpdate, current=Depends(require_roles("admin"))):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    await db.classes.update_one({"id": cid}, {"$set": update})
    return await db.classes.find_one({"id": cid}, {"_id": 0})


@router.delete("/classes/{cid}")
async def delete_class(cid: str, current=Depends(require_roles("admin"))):
    await db.classes.update_one({"id": cid}, {"$set": {"is_active": False}})
    return {"ok": True}
