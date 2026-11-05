"""auth routes."""
from fastapi import APIRouter, Depends, HTTPException, Response
from auth import create_access_token, create_refresh_token, get_current_user, hash_password, require_roles, verify_password
from core import _clear_cookies, _set_auth_cookies, db, new_id, now_iso
from models import LoginInput, RegisterInput

router = APIRouter()


# ── Auth ──
@router.post("/auth/login")
async def login(payload: LoginInput, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account disabled")
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    _set_auth_cookies(response, access, refresh)
    user.pop("password_hash", None)
    return {"user": user, "access_token": access}


@router.post("/auth/logout")
async def logout(response: Response):
    _clear_cookies(response)
    return {"ok": True}


@router.get("/auth/me")
async def me(current=Depends(get_current_user)):
    return current


@router.post("/auth/register")
async def register(payload: RegisterInput, response: Response, current=Depends(require_roles("admin"))):
    """Admin-only endpoint to create user accounts."""
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "id": new_id(),
        "email": email,
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name,
        "role": payload.role,
        "phone": payload.phone,
        "is_active": True,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    return user_doc
