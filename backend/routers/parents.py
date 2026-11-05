"""parents routes."""
from fastapi import APIRouter, Depends, HTTPException
from auth import hash_password, require_roles
from core import _sync_user, db, new_id, now_iso
from models import ParentCreate, ParentUpdate

router = APIRouter()


# ── Parents ──
@router.post("/parents")
async def create_parent(payload: ParentCreate, current=Depends(require_roles("admin"))):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    user_id = new_id()
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name,
        "role": "parent",
        "phone": payload.phone,
        "is_active": True,
        "created_at": now_iso(),
    }
    parent_doc = {
        "id": new_id(),
        "user_id": user_id,
        "full_name": payload.full_name,
        "email": email,
        "phone": payload.phone,
        "occupation": payload.occupation,
        "children_ids": payload.children_ids,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    await db.parents.insert_one(parent_doc)
    # Update student parent_id linkage
    if payload.children_ids:
        await db.students.update_many({"id": {"$in": payload.children_ids}}, {"$set": {"parent_id": user_id}})
    parent_doc.pop("_id", None)
    return parent_doc


@router.get("/parents")
async def list_parents(current=Depends(require_roles("admin"))):
    return await db.parents.find({}, {"_id": 0}).to_list(200)


@router.patch("/parents/{pid}")
async def update_parent(pid: str, payload: ParentUpdate, current=Depends(require_roles("admin"))):
    parent = await db.parents.find_one({"id": pid}, {"_id": 0})
    if not parent:
        raise HTTPException(404, "Parent not found")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    await db.parents.update_one({"id": pid}, {"$set": update})
    await _sync_user(parent.get("user_id"), update)
    if "children_ids" in update:
        # re-link: free students dropped from the list, attach the new ones
        await db.students.update_many(
            {"parent_id": parent["user_id"], "id": {"$nin": update["children_ids"]}},
            {"$set": {"parent_id": None}},
        )
        await db.students.update_many(
            {"id": {"$in": update["children_ids"]}}, {"$set": {"parent_id": parent["user_id"]}}
        )
    return await db.parents.find_one({"id": pid}, {"_id": 0})


@router.delete("/parents/{pid}")
async def delete_parent(pid: str, current=Depends(require_roles("admin"))):
    """Removes the parent account and unlinks (does not delete) their children."""
    parent = await db.parents.find_one({"id": pid}, {"_id": 0})
    if not parent:
        raise HTTPException(404, "Parent not found")
    await db.students.update_many({"parent_id": parent["user_id"]}, {"$set": {"parent_id": None}})
    await db.users.delete_one({"id": parent["user_id"]})
    await db.parents.delete_one({"id": pid})
    return {"ok": True}
