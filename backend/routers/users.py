"""users routes."""
from typing import Optional
from fastapi import APIRouter, Depends
from auth import require_roles
from core import db

router = APIRouter()


# ── Users (admin) ──
@router.get("/users")
async def list_users(role: Optional[str] = None, current=Depends(require_roles("admin"))):
    q = {}
    if role:
        q["role"] = role
    users = await db.users.find(q, {"_id": 0, "password_hash": 0}).to_list(500)
    return users
