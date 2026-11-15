"""grades routes."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
import audit
from auth import get_current_user, require_roles
from core import db, new_id, now_iso, paginate
from models import AssessmentCreate, AssessmentPublish, GradeBulkSave

router = APIRouter()


# ── Assessments & Grades ──
@router.post("/assessments")
async def create_assessment(payload: AssessmentCreate, current=Depends(require_roles("admin", "educator"))):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["is_published"] = False
    doc["created_by"] = current["id"]
    doc["created_at"] = now_iso()
    await db.assessments.insert_one(doc)
    doc.pop("_id", None)
    await audit.record(current, "create", "assessment", doc["id"], f"Created assessment {doc.get('title') or doc.get('name') or ''}".strip(),
                       audit.diff(None, doc, payload.model_dump().keys()))
    return doc


@router.get("/assessments")
async def list_assessments(class_id: Optional[str] = None, current=Depends(get_current_user)):
    q = {}
    if class_id:
        q["class_id"] = class_id
    return await db.assessments.find(q, {"_id": 0}).sort("assessment_date", -1).to_list(500)


@router.post("/grades")
async def save_grades(payload: GradeBulkSave, current=Depends(require_roles("admin", "educator"))):
    # Upsert each grade entry
    a = await db.assessments.find_one({"id": payload.assessment_id})
    if not a:
        raise HTTPException(404, "Assessment not found")
    previous = {
        g["student_id"]: g
        async for g in db.grades.find({"assessment_id": payload.assessment_id}, {"_id": 0, "student_id": 1, "score": 1, "remark": 1, "is_absent": 1})
    }
    changes = {}
    for e in payload.entries:
        old = previous.get(e.student_id) or {}
        for field, value in (("score", e.score), ("remark", e.remark), ("is_absent", e.is_absent)):
            if old.get(field) != value:
                changes[f"{e.student_id}.{field}"] = {"from": old.get(field), "to": value}
        grade_doc = {
            "id": new_id(),
            "assessment_id": payload.assessment_id,
            "student_id": e.student_id,
            "score": e.score,
            "remark": e.remark,
            "is_absent": e.is_absent,
            "max_score": a["max_score"],
            "percentage": (e.score / a["max_score"] * 100) if (e.score is not None and a["max_score"]) else None,
            "letter_grade": _letter_grade((e.score / a["max_score"] * 100) if (e.score is not None and a["max_score"]) else None),
            "is_passed": (e.score is not None and e.score >= a["pass_score"]) if e.score is not None else None,
            "entered_by": current["id"],
            "entered_at": now_iso(),
        }
        await db.grades.update_one(
            {"assessment_id": payload.assessment_id, "student_id": e.student_id},
            {"$set": grade_doc},
            upsert=True,
        )
    await audit.record(current, "update", "grades", payload.assessment_id,
                       f"Saved grades for {len(payload.entries)} students ({len(changes)} fields changed)", changes)
    return {"ok": True, "count": len(payload.entries)}


def _letter_grade(pct: Optional[float]) -> Optional[str]:
    if pct is None:
        return None
    thresholds = [(90, "A"), (80, "A-"), (75, "B+"), (70, "B"), (65, "B-"), (60, "C+"), (50, "C"), (40, "D")]
    for cutoff, grade in thresholds:
        if pct >= cutoff:
            return grade
    return "F"


@router.get("/grades")
async def list_grades(assessment_id: Optional[str] = None, student_id: Optional[str] = None, class_id: Optional[str] = None,
                      paged: bool = False, limit: int = 50, skip: int = 0, current=Depends(get_current_user)):
    q = {}
    if assessment_id:
        q["assessment_id"] = assessment_id
    role = current["role"]
    if role == "student":
        s = await db.students.find_one({"user_id": current["id"]}, {"_id": 0, "id": 1})
        if s:
            q["student_id"] = s["id"]
    elif role == "parent":
        kids = await db.students.find({"parent_id": current["id"]}, {"_id": 0, "id": 1}).to_list(50)
        q["student_id"] = {"$in": [k["id"] for k in kids]}
    if student_id and role == "admin":
        q["student_id"] = student_id

    # Narrow by class / published state inside Mongo so totals and pages stay correct.
    allowed = None
    if class_id:
        allowed = {a["id"] for a in await db.assessments.find({"class_id": class_id}, {"_id": 0, "id": 1}).to_list(500)}
    if role in ("student", "parent"):
        pub = {a["id"] for a in await db.assessments.find({"is_published": True}, {"_id": 0, "id": 1}).to_list(5000)}
        allowed = pub if allowed is None else allowed & pub
    if allowed is not None:
        if "assessment_id" in q:  # explicit assessment filter: keep it only if it is allowed
            allowed &= {q["assessment_id"]}
        q["assessment_id"] = {"$in": list(allowed)}
    return await paginate(db.grades, q, sort=[("assessment_id", 1), ("student_id", 1)], paged=paged, limit=limit, skip=skip, legacy_cap=2000)


@router.post("/assessments/publish")
async def publish_assessment(payload: AssessmentPublish, current=Depends(require_roles("admin", "educator"))):
    await db.assessments.update_one(
        {"id": payload.assessment_id},
        {"$set": {"is_published": True, "published_at": now_iso(), "published_by": current["id"]}},
    )
    await audit.record(current, "publish", "assessment", payload.assessment_id, "Published assessment results",
                       {"is_published": {"from": False, "to": True}})
    return {"ok": True}
