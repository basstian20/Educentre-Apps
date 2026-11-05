"""dashboard routes."""
from datetime import date, datetime
from fastapi import APIRouter, Depends
from auth import get_current_user
from core import _resolve_educator_id, db

router = APIRouter()


# ── Dashboard stats ──
async def _admin_stats(today: str) -> dict:
    students_count = await db.students.count_documents({"status": "active"})
    classes_count = await db.classes.count_documents({"is_active": True})
    educators_count = await db.educators.count_documents({"status": "active"})
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(2000)
    outstanding = sum(i.get("balance_due", 0) for i in invoices if i["status"] != "paid")
    payments = await db.payments.find({}, {"_id": 0}).to_list(2000)
    revenue_this_month = sum(p["amount"] for p in payments if (p.get("paid_at") or "")[:7] == today[:7])
    overdue_count = sum(
        1 for i in invoices
        if i["status"] == "overdue" or (i["status"] in ("unpaid", "partial") and i["due_date"] < today)
    )
    return {
        "active_students": students_count,
        "active_classes": classes_count,
        "active_educators": educators_count,
        "outstanding_fees": outstanding,
        "revenue_this_month": revenue_this_month,
        "overdue_invoices": overdue_count,
    }


async def _educator_stats(user_id: str) -> dict:
    edu_id = await _resolve_educator_id(user_id)
    my_classes = await db.classes.find({"educator_id": edu_id, "is_active": True}, {"_id": 0}).to_list(50)
    cids = [c["id"] for c in my_classes]
    enrolls = await db.enrollments.count_documents({"class_id": {"$in": cids}, "status": "active"})
    ass = await db.assessments.find({"class_id": {"$in": cids}, "is_published": False}, {"_id": 0}).to_list(50)
    return {
        "my_classes": len(my_classes),
        "total_students": enrolls,
        "pending_assessments": len(ass),
        "today_classes": [c for c in my_classes if _today_dow() in (c.get("schedule_days") or [])],
    }


_ATT_STATUSES = ("present", "late", "absent", "excused")


async def _attendance_counts(match: dict):
    """Count attendance by status (overall and per class) inside MongoDB, never loading raw rows."""
    rows = await db.attendance.aggregate([
        {"$match": match},
        {"$group": {"_id": {"c": "$class_id", "s": "$status"}, "n": {"$sum": 1}}},
    ]).to_list(None)
    summary = {s: 0 for s in _ATT_STATUSES}
    by_class = {}
    for r in rows:
        st = r["_id"].get("s") or "present"
        if st not in summary:
            continue
        summary[st] += r["n"]
        by_class.setdefault(r["_id"]["c"], {s: 0 for s in _ATT_STATUSES})[st] += r["n"]
    return summary, by_class


async def _attendance_pct(match: dict) -> float:
    summary, _ = await _attendance_counts(match)
    total = sum(summary.values())
    if not total:
        return 100
    return round(summary["present"] / total * 100, 1)


async def _student_stats(user_id: str) -> dict:
    s = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not s:
        return {}
    enrolls = await db.enrollments.find({"student_id": s["id"], "status": "active"}, {"_id": 0}).to_list(50)
    cids = [e["class_id"] for e in enrolls]
    my_classes = await db.classes.find({"id": {"$in": cids}}, {"_id": 0}).to_list(50)
    return {
        "active_classes": len(my_classes),
        "today_classes": [c for c in my_classes if _today_dow() in (c.get("schedule_days") or [])],
        "attendance_pct": await _attendance_pct({"student_id": s["id"]}),
        "student": s,
    }


async def _parent_stats(user_id: str) -> dict:
    kids = await db.students.find({"parent_id": user_id}, {"_id": 0}).to_list(20)
    kid_ids = [k["id"] for k in kids]
    enrolls = await db.enrollments.find({"student_id": {"$in": kid_ids}, "status": "active"}, {"_id": 0}).to_list(200)
    cids = list({e["class_id"] for e in enrolls})
    my_classes = await db.classes.find({"id": {"$in": cids}}, {"_id": 0}).to_list(50)
    invs = await db.invoices.find({"student_id": {"$in": kid_ids}}, {"_id": 0}).to_list(200)
    outstanding = sum(i.get("balance_due", 0) for i in invs if i["status"] != "paid")
    return {
        "children_count": len(kids),
        "children": kids,
        "active_classes": len(my_classes),
        "outstanding_fees": outstanding,
        "attendance_pct": await _attendance_pct({"student_id": {"$in": kid_ids}}),
        "today_classes": [c for c in my_classes if _today_dow() in (c.get("schedule_days") or [])],
    }


@router.get("/dashboard/stats")
async def dashboard_stats(current=Depends(get_current_user)):
    role = current["role"]
    today = date.today().isoformat()
    if role == "admin":
        return await _admin_stats(today)
    if role == "educator":
        return await _educator_stats(current["id"])
    if role == "student":
        return await _student_stats(current["id"])
    if role == "parent":
        return await _parent_stats(current["id"])
    return {}


def _today_dow():
    # 1=Mon..7=Sun (matching wireframes)
    return datetime.now().isoweekday()
