"""notifications routes."""
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from auth import get_current_user
from core import _resolve_educator_id, db, not_deleted
from routers.dashboard import _today_dow
from routers.invoices import _visible_student_ids

router = APIRouter()


# ── Notifications (computed on the fly, nothing stored) ──
@router.get("/notifications")
async def notifications(current=Depends(get_current_user)):
    role = current["role"]
    today = date.today()
    today_s = today.isoformat()
    soon_s = (today + timedelta(days=3)).isoformat()
    week_ago_s = (today - timedelta(days=7)).isoformat()
    items = []

    if role == "educator":
        edu_id = await _resolve_educator_id(current["id"])
        n = await db.classes.count_documents({"educator_id": edu_id, "is_active": True, "schedule_days": _today_dow()})
        if n:
            items.append({"id": f"classes-{today_s}", "kind": "classes_today", "severity": "info", "count": n, "link": "/classes"})
        return items

    visible = await _visible_student_ids(current)
    invoices = []
    if role in ("admin", "parent"):  # finance notices are for admin and parents only
        q = not_deleted({"status": {"$in": ["unpaid", "partial", "overdue"]}})
        if visible is not None:
            q["student_id"] = {"$in": list(visible)}
        invoices = await db.invoices.find(q, {"_id": 0}).sort("due_date", 1).to_list(200)

    stu_ids = list({i["student_id"] for i in invoices})
    students = await db.students.find({"id": {"$in": stu_ids}}, {"_id": 0}).to_list(500)
    stu_map = {s["id"]: s for s in students}
    phone_by_parent = {}
    if role == "admin":
        parent_ids = [s["parent_id"] for s in students if s.get("parent_id")]
        for p in await db.parents.find(not_deleted({"user_id": {"$in": parent_ids}}), {"_id": 0, "user_id": 1, "phone": 1}).to_list(500):
            phone_by_parent[p["user_id"]] = p.get("phone")

    for inv in invoices:
        due = inv.get("due_date") or ""
        if inv.get("balance_due", 0) <= 0 or due > soon_s:
            continue
        stu = stu_map.get(inv["student_id"], {})
        overdue = due < today_s
        items.append({
            "id": f"inv-{inv['id']}-{'overdue' if overdue else 'soon'}",
            "kind": "invoice_overdue" if overdue else "invoice_due_soon",
            "severity": "danger" if overdue else "warning",
            "student_name": stu.get("full_name"),
            "invoice_number": inv.get("invoice_number"),
            "amount": inv.get("balance_due"),
            "due_date": due,
            "phone": (phone_by_parent.get(stu.get("parent_id")) or stu.get("phone")) if role == "admin" else None,
            "link": "/invoices",
        })

    if role in ("student", "parent") and visible:
        absences = await db.attendance.find(
            {"student_id": {"$in": list(visible)}, "status": "absent", "session_date": {"$gte": week_ago_s}}, {"_id": 0}
        ).to_list(200)
        names = {s["id"]: s["full_name"] for s in await db.students.find({"id": {"$in": list(visible)}}, {"_id": 0, "id": 1, "full_name": 1}).to_list(50)}
        for a in absences:
            items.append({
                "id": f"abs-{a['id']}",
                "kind": "absent",
                "severity": "warning",
                "student_name": names.get(a["student_id"]),
                "date": a["session_date"],
                "link": "/dashboard",
            })

    order = {"danger": 0, "warning": 1, "info": 2}
    items.sort(key=lambda i: order.get(i["severity"], 3))
    return items[:40]
