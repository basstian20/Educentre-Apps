"""educators routes."""
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user, hash_password, require_roles
from core import _gen_educator_code, _sync_user, db, new_id, now_iso
from models import EducatorCreate, EducatorUpdate

router = APIRouter()


# ── Educators ──
@router.post("/educators")
async def create_educator(payload: EducatorCreate, current=Depends(require_roles("admin"))):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    user_id = new_id()
    educator_id = new_id()
    code = await _gen_educator_code()
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name,
        "role": "educator",
        "phone": payload.phone,
        "is_active": True,
        "created_at": now_iso(),
    }
    edu_doc = {
        "id": educator_id,
        "user_id": user_id,
        "staff_code": code,
        "full_name": payload.full_name,
        "email": email,
        "phone": payload.phone,
        "subjects": payload.subjects,
        "employment_type": payload.employment_type,
        "qualifications": payload.qualifications,
        "status": "active",
        "hire_date": now_iso(),
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    await db.educators.insert_one(edu_doc)
    edu_doc.pop("_id", None)
    return edu_doc


@router.get("/educators")
async def list_educators(current=Depends(get_current_user)):
    educators = await db.educators.find({}, {"_id": 0}).to_list(200)
    return educators


@router.patch("/educators/{eid}")
async def update_educator(eid: str, payload: EducatorUpdate, current=Depends(require_roles("admin"))):
    edu = await db.educators.find_one({"id": eid}, {"_id": 0})
    if not edu:
        raise HTTPException(404, "Educator not found")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    await db.educators.update_one({"id": eid}, {"$set": update})
    await _sync_user(edu.get("user_id"), update)
    return await db.educators.find_one({"id": eid}, {"_id": 0})


@router.delete("/educators/{eid}")
async def deactivate_educator(eid: str, current=Depends(require_roles("admin"))):
    """Soft delete: keeps the educator's classes and history, blocks login."""
    edu = await db.educators.find_one({"id": eid}, {"_id": 0})
    if not edu:
        raise HTTPException(404, "Educator not found")
    await db.educators.update_one({"id": eid}, {"$set": {"status": "inactive", "updated_at": now_iso()}})
    await _sync_user(edu.get("user_id"), {"status": "inactive"})
    return {"ok": True}
