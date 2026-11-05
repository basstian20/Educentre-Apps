"""settings routes."""
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user, hash_password, require_roles, verify_password
from core import db, now_iso
from models import CentreSettings, PasswordChange, ProfileUpdate
from routers.invoices import _get_centre

router = APIRouter()


# ── Centre settings & profile ──
@router.get("/settings")
async def get_settings(current=Depends(get_current_user)):
    return await _get_centre()


@router.put("/settings")
async def put_settings(payload: CentreSettings, current=Depends(require_roles("admin"))):
    doc = {"id": "centre", **payload.model_dump(), "updated_at": now_iso()}
    await db.settings.update_one({"id": "centre"}, {"$set": doc}, upsert=True)
    return doc


@router.patch("/auth/me")
async def update_me(payload: ProfileUpdate, current=Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "full_name" in update and not update["full_name"].strip():
        raise HTTPException(400, "Name can't be empty")
    if update:
        await db.users.update_one({"id": current["id"]}, {"$set": update})
        # keep the role profile (student/educator/parent) in step with the login account
        for coll in ("students", "educators", "parents"):
            await db[coll].update_one({"user_id": current["id"]}, {"$set": update})
    return await db.users.find_one({"id": current["id"]}, {"_id": 0, "password_hash": 0})


@router.post("/auth/change-password")
async def change_password(payload: PasswordChange, current=Depends(get_current_user)):
    user = await db.users.find_one({"id": current["id"]})
    if not verify_password(payload.current_password, user["password_hash"]):
        raise HTTPException(400, "Current password is incorrect")
    if len(payload.new_password) < 6:
        raise HTTPException(400, "New password must be at least 6 characters")
    await db.users.update_one({"id": current["id"]}, {"$set": {"password_hash": hash_password(payload.new_password)}})
    return {"ok": True}
