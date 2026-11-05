"""Brute-force protection for ``POST /auth/login``.

Failed sign-ins (wrong password *or* unknown email, so existence is not revealed) are counted
in the ``login_attempts`` collection under two keys:

* ``ip|email``  - locks after ``LOGIN_MAX_ATTEMPTS`` (default 5) failures.
* ``email``     - locks after ``LOGIN_MAX_ATTEMPTS_PER_EMAIL`` (default 20) failures from any address,
                  which stops an attacker who rotates IPs against one account.

A lock lasts ``LOGIN_LOCK_SECONDS`` (default 900). While locked the correct password is rejected too
and attempts are not counted, so the lock cannot be extended. Counters reset after a successful login
or once the window passes without new failures (a TTL index also removes stale rows).

Set ``TRUST_PROXY=true`` when the API runs behind a reverse proxy, so the real client address is read
from ``X-Forwarded-For`` instead of the proxy's.
"""
import math
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, Request
from pymongo import ReturnDocument

from core import db


def _int_env(name: str, default: int) -> int:
    try:
        return max(1, int(os.environ.get(name, default)))
    except ValueError:
        return default


MAX_ATTEMPTS = _int_env("LOGIN_MAX_ATTEMPTS", 5)
MAX_ATTEMPTS_PER_EMAIL = _int_env("LOGIN_MAX_ATTEMPTS_PER_EMAIL", 20)
LOCK_SECONDS = _int_env("LOGIN_LOCK_SECONDS", 900)


def _now() -> datetime:
    # MongoDB hands back naive UTC datetimes, so compare naive UTC everywhere.
    return datetime.now(timezone.utc).replace(tzinfo=None)


def client_ip(request: Request) -> str:
    if os.environ.get("TRUST_PROXY", "").strip().lower() in ("1", "true", "yes"):
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _keys(ip: str, email: str):
    return f"ip:{ip}|{email}", f"email:{email}"


def locked_error(seconds: int) -> HTTPException:
    seconds = max(1, int(seconds))
    minutes = math.ceil(seconds / 60)
    unit = "minute" if minutes == 1 else "minutes"
    return HTTPException(
        status_code=429,
        detail=f"Too many login attempts. Try again in {minutes} {unit}.",
        headers={"Retry-After": str(seconds)},
    )


async def ensure_not_locked(ip: str, email: str) -> None:
    """Raise 429 when this ip+email or the email alone is currently locked."""
    now = _now()
    remaining = 0
    async for doc in db.login_attempts.find({"_id": {"$in": list(_keys(ip, email))}, "locked_until": {"$gt": now}}):
        remaining = max(remaining, math.ceil((doc["locked_until"] - now).total_seconds()))
    if remaining:
        raise locked_error(remaining)


async def _fail(key: str, email: str, limit: int) -> Optional[int]:
    now = _now()
    # An idle counter (window elapsed) starts again from zero even if the TTL sweeper has not run yet.
    await db.login_attempts.update_one(
        {"_id": key, "expires_at": {"$lte": now}},
        {"$set": {"failures": 0, "locked_until": None}},
    )
    doc = await db.login_attempts.find_one_and_update(
        {"_id": key},
        {
            "$inc": {"failures": 1},
            "$set": {"email": email, "last_failure_at": now, "expires_at": now + timedelta(seconds=LOCK_SECONDS)},
            "$setOnInsert": {"locked_until": None},
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    if doc["failures"] >= limit:
        until = now + timedelta(seconds=LOCK_SECONDS)
        await db.login_attempts.update_one({"_id": key}, {"$set": {"locked_until": until, "expires_at": until}})
        return LOCK_SECONDS
    return None


async def register_failure(ip: str, email: str) -> Optional[int]:
    """Count a failed sign-in. Returns the lock duration in seconds when this failure trips a lock."""
    ip_key, email_key = _keys(ip, email)
    tripped = [await _fail(ip_key, email, MAX_ATTEMPTS), await _fail(email_key, email, MAX_ATTEMPTS_PER_EMAIL)]
    tripped = [t for t in tripped if t]
    return max(tripped) if tripped else None


async def register_success(ip: str, email: str) -> None:
    await db.login_attempts.delete_many({"_id": {"$in": list(_keys(ip, email))}})


async def list_locks() -> list:
    now = _now()
    out = []
    async for doc in db.login_attempts.find({"locked_until": {"$gt": now}}):
        out.append(
            {
                "key": doc["_id"],
                "email": doc.get("email"),
                "failures": doc.get("failures", 0),
                "locked_until": doc["locked_until"].replace(tzinfo=timezone.utc).isoformat(),
            }
        )
    return out


async def clear_email(email: str) -> int:
    result = await db.login_attempts.delete_many({"email": email})
    return result.deleted_count
