"""Shared state and helpers used by every router."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import Response
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from database import get_db

# ── DB ──
db = get_db()


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("educentre")

# ── Helpers ──
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def _set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=12 * 3600, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=7 * 86400, path="/")


def _clear_cookies(response: Response):
    response.delete_cookie("access_token",  path="/", httponly=True, secure=True, samesite="none")
    response.delete_cookie("refresh_token", path="/", httponly=True, secure=True, samesite="none")


async def _gen_student_code():
    count = await db.students.count_documents({})
    return f"SC-{datetime.now().year}-{(count + 1):04d}"


async def _gen_educator_code():
    count = await db.educators.count_documents({})
    return f"EDU-{datetime.now().year}-{(count + 1):04d}"


def not_deleted(query: Optional[dict] = None) -> dict:
    """Add the soft-delete filter to a Mongo query (documents without the field count as live)."""
    return {**(query or {}), "deleted_at": None}


def deleted_fields(actor_id: str) -> dict:
    """Fields written when a document is moved to the trash."""
    return {"deleted_at": now_iso(), "deleted_by": actor_id}


UNDELETE_FIELDS = {"deleted_at": None, "deleted_by": None}


async def _next_counter(name: str, current_max) -> int:
    """Atomically increment a named counter; on first use start from the highest existing value."""
    doc = await db.counters.find_one_and_update({"_id": name}, {"$inc": {"seq": 1}}, return_document=ReturnDocument.AFTER)
    if doc is None:
        try:
            await db.counters.insert_one({"_id": name, "seq": await current_max()})
        except DuplicateKeyError:
            pass  # another request initialised it first
        doc = await db.counters.find_one_and_update({"_id": name}, {"$inc": {"seq": 1}}, return_document=ReturnDocument.AFTER)
    return doc["seq"]


async def _highest_invoice_seq() -> int:
    best = 0
    async for inv in db.invoices.find({}, {"_id": 0, "invoice_number": 1}):
        tail = (inv.get("invoice_number") or "").rsplit("-", 1)[-1]
        if tail.isdigit():
            best = max(best, int(tail))
    return best


async def _gen_invoice_number():
    """Sequential and never reused, even after invoices are deleted (counter lives in `counters`)."""
    seq = await _next_counter("invoice", _highest_invoice_seq)
    return f"INV-{datetime.now().year}-{seq:05d}"


async def _resolve_educator_id(user_id: str) -> Optional[str]:
    """Educator records have their own id; classes.educator_id references educators.id, not users.id."""
    edu = await db.educators.find_one({"user_id": user_id}, {"_id": 0, "id": 1})
    return edu["id"] if edu else None


async def _resolve_student_id(user_id: str) -> Optional[str]:
    s = await db.students.find_one({"user_id": user_id}, {"_id": 0, "id": 1})
    return s["id"] if s else None


async def _sync_user(user_id: Optional[str], update: dict):
    """Mirror profile edits (name, phone, active status) onto the login account."""
    if not user_id:
        return
    changes = {}
    if "full_name" in update:
        changes["full_name"] = update["full_name"]
    if "phone" in update:
        changes["phone"] = update["phone"]
    if "status" in update:
        changes["is_active"] = update["status"] == "active"
    if changes:
        await db.users.update_one({"id": user_id}, {"$set": changes})
