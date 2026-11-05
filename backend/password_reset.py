"""Password reset by emailed one-time link.

Only the SHA-256 hash of the token is stored (collection ``password_resets``), so a database leak does
not yield usable links. A token works once, expires after ``PASSWORD_RESET_MINUTES`` (default 30), and
asking for a new link revokes the previous ones. At most ``PASSWORD_RESET_MAX_PER_HOUR`` (default 3)
links are issued per account per hour, so the endpoint cannot be used to spam an inbox.
"""
import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from fastapi import HTTPException
from pymongo import ReturnDocument

import login_guard
from auth import hash_password
from core import db, logger, now_iso

MIN_PASSWORD_LENGTH = 6


def _float_env(name: str, default: float) -> float:
    try:
        return max(0.01, float(os.environ.get(name, default)))
    except ValueError:
        return default


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)  # Mongo returns naive UTC


def ttl_minutes() -> float:
    return _float_env("PASSWORD_RESET_MINUTES", 30)


def max_per_hour() -> int:
    return int(_float_env("PASSWORD_RESET_MAX_PER_HOUR", 3))


def frontend_url() -> str:
    return os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def issue_token(email: str) -> Optional[Tuple[dict, str]]:
    """Create a reset link for an active account. Returns (user, link), or None when nothing is sent
    (unknown or disabled account, or too many recent requests) - the caller answers identically."""
    user = await db.users.find_one(
        {"email": email, "is_active": {"$ne": False}}, {"_id": 0, "id": 1, "full_name": 1, "email": 1}
    )
    if not user:
        return None
    now = _now()
    recent = await db.password_resets.count_documents(
        {"user_id": user["id"], "created_at": {"$gt": now - timedelta(hours=1)}}
    )
    if recent >= max_per_hour():
        logger.warning("Password reset throttled for %s", email)
        return None
    await db.password_resets.update_many({"user_id": user["id"], "used_at": None}, {"$set": {"used_at": now}})
    token = secrets.token_urlsafe(32)
    await db.password_resets.insert_one(
        {
            "_id": hash_token(token),
            "user_id": user["id"],
            "email": user["email"],
            "created_at": now,
            "expires_at": now + timedelta(minutes=ttl_minutes()),
            "purge_at": now + timedelta(days=1),  # TTL target; kept past expiry for the hourly throttle
            "used_at": None,
        }
    )
    return user, f"{frontend_url()}/reset-password?token={token}"


def email_body(name: str, link: str) -> Tuple[str, str]:
    minutes = max(1, int(ttl_minutes()))
    subject = "Atur ulang kata sandi EduCentre / Reset your EduCentre password"
    body = (
        f"Halo {name},\n\n"
        f"Kami menerima permintaan untuk mengatur ulang kata sandi akun EduCentre Anda. "
        f"Buka tautan berikut (berlaku {minutes} menit, hanya sekali pakai):\n{link}\n\n"
        f"Jika bukan Anda yang meminta, abaikan email ini; kata sandi Anda tidak berubah.\n\n"
        f"---\n\n"
        f"Hello {name},\n\n"
        f"We received a request to reset your EduCentre password. "
        f"Open this link (valid for {minutes} minutes, single use):\n{link}\n\n"
        f"If you did not ask for this, ignore this email; your password stays the same.\n"
    )
    return subject, body


async def reset_password(token: str, new_password: str) -> None:
    if len(new_password) < MIN_PASSWORD_LENGTH:
        # checked first so a typo in the new password does not burn the link
        raise HTTPException(400, "New password must be at least 6 characters")
    now = _now()
    claimed = None
    if 0 < len(token) <= 200:
        claimed = await db.password_resets.find_one_and_update(
            {"_id": hash_token(token), "used_at": None, "expires_at": {"$gt": now}},
            {"$set": {"used_at": now}},
            return_document=ReturnDocument.BEFORE,
        )
    if not claimed:
        raise HTTPException(400, "Invalid or expired reset link")
    await db.users.update_one(
        {"id": claimed["user_id"]},
        {"$set": {"password_hash": hash_password(new_password), "password_changed_at": now_iso()}},
    )
    await db.password_resets.update_many({"user_id": claimed["user_id"], "used_at": None}, {"$set": {"used_at": now}})
    await login_guard.clear_email(claimed["email"])
