"""health routes."""
import asyncio
import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from core import db, logger

router = APIRouter()
_STARTED = time.monotonic()
DB_TIMEOUT_SECONDS = 3


# ── Health ──
@router.get("/")
async def root():
    return {"message": "EduCentre API", "status": "ok"}


@router.get("/health")
async def health():
    """Liveness + database reachability for the platform health check. 503 when MongoDB does not answer."""
    try:
        await asyncio.wait_for(db.command("ping"), timeout=DB_TIMEOUT_SECONDS)
        database = "ok"
    except Exception as exc:
        logger.error("Health check: database unreachable (%s)", type(exc).__name__)
        database = "error"
    body = {"status": "ok" if database == "ok" else "degraded", "database": database,
            "uptime_seconds": int(time.monotonic() - _STARTED)}
    return JSONResponse(body, status_code=200 if database == "ok" else 503)
