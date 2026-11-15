"""Audit trail: who changed what, and when (collection ``audit_logs``).

Write endpoints call ``audit.record(...)`` explicitly - only the route knows the entity and which
fields changed. Recording never fails a request: errors are logged as warnings and swallowed.

Each row holds ``id``, ``at`` (ISO UTC), ``actor_id/name/role``, ``action``, ``entity``, ``entity_id``,
``summary``, ``changes`` (``{field: {"from": .., "to": ..}}``, changed fields only) and ``ip``.
Values whose field name looks sensitive (password, hash, token, secret) are replaced by ``***``.

``AUDIT_RETENTION_DAYS`` (default 0 = keep forever) sets a TTL on new rows so the collection cannot
grow without bound.
"""
import os
from contextvars import ContextVar
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, Optional

from core import db, logger, new_id, now_iso

REDACTED = "***"
SENSITIVE_PARTS = ("password", "hash", "token", "secret")
# bookkeeping fields that change on every write and say nothing about the edit itself
NOISE_FIELDS = {"_id", "updated_at", "created_at"}
MAX_TEXT = 500

_client_ip: ContextVar[Optional[str]] = ContextVar("audit_client_ip", default=None)


def set_client_ip(ip: Optional[str]) -> None:
    _client_ip.set(ip)


def retention_days() -> int:
    try:
        return max(0, int(os.environ.get("AUDIT_RETENTION_DAYS", "0")))
    except ValueError:
        return 0


def _is_sensitive(key: Any) -> bool:
    k = str(key).lower()
    return any(part in k for part in SENSITIVE_PARTS)


def _clean(value: Any, key: Any = None) -> Any:
    """JSON-safe copy of a value with secrets masked and long text trimmed."""
    if key is not None and _is_sensitive(key):
        return REDACTED
    if isinstance(value, dict):
        return {str(k): _clean(v, k) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_clean(v) for v in value]
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, (bytes, bytearray)):
        return f"<{len(value)} bytes>"
    if isinstance(value, str) and len(value) > MAX_TEXT:
        return value[:MAX_TEXT] + "…"
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def diff(before: Optional[dict], after: Optional[dict], keys=None) -> Dict[str, dict]:
    """Changed fields only, as ``{field: {"from": old, "to": new}}``. ``before=None`` describes a creation."""
    before = before or {}
    after = after or {}
    out: Dict[str, dict] = {}
    for k in keys if keys is not None else after.keys():
        if k in NOISE_FIELDS:
            continue
        old, new = before.get(k), after.get(k)
        if old != new:
            out[k] = {"from": _clean(old, k), "to": _clean(new, k)}
    return out


async def record(
    actor: Optional[dict],
    action: str,
    entity: str,
    entity_id: Optional[str] = None,
    summary: str = "",
    changes: Optional[dict] = None,
    ip: Optional[str] = None,
) -> None:
    """Append one audit row. ``actor`` is the signed-in user dict (or ``{"email": ..}`` for anonymous events)."""
    try:
        actor = actor or {}
        row = {
            "id": new_id(),
            "at": now_iso(),
            "actor_id": actor.get("id"),
            "actor_name": actor.get("full_name") or actor.get("email"),
            "actor_role": actor.get("role"),
            "action": action,
            "entity": entity,
            "entity_id": entity_id,
            "summary": summary,
            "changes": _clean(changes) if changes else None,
            "ip": ip or _client_ip.get(),
        }
        days = retention_days()
        if days:
            row["expires_at"] = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=days)
        await db.audit_logs.insert_one(row)
    except Exception as exc:  # the audit trail must never break the action it describes
        logger.warning("Audit log write failed (%s %s/%s): %s", action, entity, entity_id, exc)


async def ensure_indexes() -> None:
    await db.audit_logs.create_index([("at", -1)])
    await db.audit_logs.create_index([("entity", 1), ("entity_id", 1)])
    await db.audit_logs.create_index("actor_id")
    # only rows written with a retention period carry expires_at
    await db.audit_logs.create_index("expires_at", expireAfterSeconds=0)
