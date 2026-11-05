"""health routes."""
from fastapi import APIRouter

router = APIRouter()


# ── Health ──
@router.get("/")
async def root():
    return {"message": "EduCentre API", "status": "ok"}
