"""reports routes."""
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from core import db, now_iso
from routers.dashboard import _attendance_counts
from routers.invoices import _get_centre, _visible_student_ids

router = APIRouter()


# ── Report card ──
@router.get("/students/{sid}/report")
async def student_report(sid: str, current=Depends(get_current_user)):
    visible = await _visible_student_ids(current)
    if visible is not None and sid not in visible:
        raise HTTPException(403, "Not allowed to view this report")
    student = await db.students.find_one({"id": sid}, {"_id": 0})
    if not student:
        raise HTTPException(404, "Student not found")

    enrolls = await db.enrollments.find({"student_id": sid, "status": "active"}, {"_id": 0, "class_id": 1}).to_list(100)
    class_ids = [e["class_id"] for e in enrolls]
    classes = await db.classes.find({"id": {"$in": class_ids}}, {"_id": 0}).to_list(100)
    class_map = {c["id"]: c for c in classes}
    edus = await db.educators.find({"id": {"$in": [c.get("educator_id") for c in classes]}}, {"_id": 0, "id": 1, "full_name": 1}).to_list(100)
    edu_map = {e["id"]: e["full_name"] for e in edus}

    summary, by_class = await _attendance_counts({"student_id": sid})
    total = sum(summary.values())
    attended = summary["present"] + summary["late"]

    grades = await db.grades.find({"student_id": sid}, {"_id": 0}).to_list(2000)
    ass_map = {
        a["id"]: a
        for a in await db.assessments.find(
            {"id": {"$in": [g["assessment_id"] for g in grades]}, "is_published": True}, {"_id": 0}
        ).to_list(1000)
    }
    rows = []
    for g in grades:
        a = ass_map.get(g["assessment_id"])
        if not a:
            continue
        mx = g.get("max_score") or 0
        rows.append({
            "class_name": class_map.get(a.get("class_id"), {}).get("subject_name", "—"),
            "assessment_name": a.get("name"),
            "date": a.get("assessment_date"),
            "score": g.get("score"),
            "max_score": mx,
            "letter_grade": g.get("letter_grade"),
            "remark": g.get("remark"),
        })
    scored = [r for r in rows if r["max_score"] and r["score"] is not None]
    average = round(sum(r["score"] / r["max_score"] * 100 for r in scored) / len(scored), 1) if scored else None

    return {
        "student": {k: student.get(k) for k in ("full_name", "student_code", "email", "school_name", "school_year", "dob")},
        "centre": await _get_centre(),
        "classes": [
            {
                "subject_name": c["subject_name"],
                "level": c.get("level"),
                "educator_name": edu_map.get(c.get("educator_id"), "—"),
                "attendance": by_class.get(c["id"], {"present": 0, "late": 0, "absent": 0, "excused": 0}),
            }
            for c in classes
        ],
        "attendance": {**summary, "total": total, "percentage": round(attended / total * 100, 1) if total else None},
        "grades": sorted(rows, key=lambda r: (r["date"] or ""), reverse=True),
        "average_percentage": average,
        "generated_at": now_iso(),
    }
