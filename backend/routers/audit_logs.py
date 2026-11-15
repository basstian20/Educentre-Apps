"""Admin viewer for the audit trail."""
import re
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from auth import require_roles
from core import db

router = APIRouter()


def _day(value: str, name: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise HTTPException(400, f"{name} must be YYYY-MM-DD")


@router.get("/audit-logs")
async def list_audit_logs(
    entity: Optional[str] = None,
    entity_id: Optional[str] = None,
    actor_id: Optional[str] = None,
    action: Optional[str] = None,
    q: Optional[str] = Query(None, max_length=100, description="free text in summary / actor name"),
    date_from: Optional[str] = Query(None, description="YYYY-MM-DD, inclusive"),
    date_to: Optional[str] = Query(None, description="YYYY-MM-DD, inclusive"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current=Depends(require_roles("admin")),
):
    query: dict = {}
    for key, value in (("entity", entity), ("entity_id", entity_id), ("actor_id", actor_id), ("action", action)):
        if value:
            query[key] = value
    if q:
        pattern = {"$regex": re.escape(q), "$options": "i"}
        query["$or"] = [{"summary": pattern}, {"actor_name": pattern}]
    window = {}
    if date_from:
        window["$gte"] = _day(date_from, "date_from").isoformat()
    if date_to:
        # `at` is an ISO timestamp; everything before midnight of the next day belongs to date_to
        window["$lt"] = (_day(date_to, "date_to") + timedelta(days=1)).isoformat()
    if window:
        query["at"] = window
    total = await db.audit_logs.count_documents(query)
    items = await db.audit_logs.find(query, {"_id": 0, "expires_at": 0}).sort("at", -1).skip(skip).limit(limit).to_list(limit)
    return {"items": items, "total": total}
