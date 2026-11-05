"""grades routes."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user, require_roles
from core import db, new_id, now_iso
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
    for e in payload.entries:
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
async def list_grades(assessment_id: Optional[str] = None, student_id: Optional[str] = None, class_id: Optional[str] = None, current=Depends(get_current_user)):
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

    grades = await db.grades.find(q, {"_id": 0}).to_list(2000)

    if class_id:
        # filter by assessments belonging to this class
        ass_ids = [a["id"] for a in await db.assessments.find({"class_id": class_id}, {"_id": 0, "id": 1}).to_list(500)]
        grades = [g for g in grades if g["assessment_id"] in ass_ids]

    # for non-admin/non-educator, only return grades for published assessments
    if role in ("student", "parent"):
        ass_ids = list({g["assessment_id"] for g in grades})
        published = await db.assessments.find({"id": {"$in": ass_ids}, "is_published": True}, {"_id": 0, "id": 1}).to_list(500)
        pub_ids = {a["id"] for a in published}
        grades = [g for g in grades if g["assessment_id"] in pub_ids]
    return grades


@router.post("/assessments/publish")
async def publish_assessment(payload: AssessmentPublish, current=Depends(require_roles("admin", "educator"))):
    await db.assessments.update_one(
        {"id": payload.assessment_id},
        {"$set": {"is_published": True, "published_at": now_iso(), "published_by": current["id"]}},
    )
    return {"ok": True}
