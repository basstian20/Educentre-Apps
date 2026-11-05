"""invoices routes."""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user, require_roles
from core import _gen_invoice_number, db, new_id, now_iso
from models import InvoiceCreate, InvoiceUpdate, PaymentRecord

router = APIRouter()


# ── Invoices ──
@router.post("/invoices")
async def create_invoice(payload: InvoiceCreate, current=Depends(require_roles("admin"))):
    items = [i.model_dump() for i in payload.items]
    subtotal = sum(i["amount"] for i in items)
    inv = {
        "id": new_id(),
        "invoice_number": await _gen_invoice_number(),
        "student_id": payload.student_id,
        "billing_month": payload.billing_month,
        "items": items,
        "subtotal": subtotal,
        "discount_amount": 0,
        "tax_amount": 0,
        "total_amount": subtotal,
        "amount_paid": 0,
        "balance_due": subtotal,
        "due_date": payload.due_date,
        "status": "unpaid",
        "notes": payload.notes,
        "created_at": now_iso(),
    }
    await db.invoices.insert_one(inv)
    inv.pop("_id", None)
    return inv


@router.get("/invoices")
async def list_invoices(student_id: Optional[str] = None, status: Optional[str] = None, current=Depends(get_current_user)):
    q = {}
    role = current["role"]
    if role == "parent":
        kids = await db.students.find({"parent_id": current["id"]}, {"_id": 0, "id": 1}).to_list(50)
        q["student_id"] = {"$in": [k["id"] for k in kids]}
    elif role != "admin":
        # Finance belongs to admin and parents only; students and educators see nothing.
        return []
    if student_id and role == "admin":
        q["student_id"] = student_id
    if status:
        q["status"] = status
    today = date.today().isoformat()
    # Persist overdue status
    await db.invoices.update_many(
        {"status": {"$in": ["unpaid", "partial"]}, "due_date": {"$lt": today}},
        {"$set": {"status": "overdue"}},
    )
    invoices = await db.invoices.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return invoices


async def _visible_student_ids(current: dict) -> Optional[set]:
    """Student ids this user may see. None means everyone (admin)."""
    role = current["role"]
    if role == "admin":
        return None
    if role == "student":
        s = await db.students.find_one({"user_id": current["id"]}, {"_id": 0, "id": 1})
        return {s["id"]} if s else set()
    if role == "parent":
        kids = await db.students.find({"parent_id": current["id"]}, {"_id": 0, "id": 1}).to_list(50)
        return {k["id"] for k in kids}
    return set()


async def _get_centre() -> dict:
    doc = await db.settings.find_one({"id": "centre"}, {"_id": 0})
    return doc or {"id": "centre", "centre_name": "EduCentre", "address": "", "phone": "", "email": ""}


async def _invoice_for(iid: str, current: dict) -> dict:
    inv = await db.invoices.find_one({"id": iid}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Invoice not found")
    visible = await _visible_student_ids(current)
    if current["role"] == "student" or (visible is not None and inv["student_id"] not in visible):
        raise HTTPException(403, "Not allowed to view this invoice")
    return inv


@router.get("/invoices/{iid}")
async def get_invoice(iid: str, current=Depends(get_current_user)):
    return await _invoice_for(iid, current)


@router.get("/invoices/{iid}/document")
async def invoice_document(iid: str, current=Depends(get_current_user)):
    """Everything needed to print an invoice or a payment receipt."""
    inv = await _invoice_for(iid, current)
    student = await db.students.find_one({"id": inv["student_id"]}, {"_id": 0})
    parent = None
    if student and student.get("parent_id"):
        parent = await db.parents.find_one({"user_id": student["parent_id"]}, {"_id": 0, "full_name": 1, "phone": 1})
    payments = await db.payments.find({"invoice_id": iid}, {"_id": 0}).sort("paid_at", 1).to_list(200)
    return {
        "invoice": inv,
        "student": {k: (student or {}).get(k) for k in ("full_name", "student_code", "email", "school_name", "school_year")},
        "parent": parent,
        "payments": payments,
        "centre": await _get_centre(),
    }


@router.patch("/invoices/{iid}")
async def update_invoice(iid: str, payload: InvoiceUpdate, current=Depends(require_roles("admin"))):
    inv = await db.invoices.find_one({"id": iid}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Invoice not found")
    update = {k: v for k, v in payload.model_dump(exclude={"items"}).items() if v is not None}
    if payload.items is not None:
        if inv.get("amount_paid", 0) > 0:
            raise HTTPException(400, "Amounts can't be changed after a payment was recorded")
        items = [i.model_dump() for i in payload.items]
        subtotal = sum(i["amount"] for i in items)
        update.update({"items": items, "subtotal": subtotal, "total_amount": subtotal, "balance_due": subtotal})
    update["updated_at"] = now_iso()
    await db.invoices.update_one({"id": iid}, {"$set": update})
    return await db.invoices.find_one({"id": iid}, {"_id": 0})


@router.delete("/invoices/{iid}")
async def delete_invoice(iid: str, current=Depends(require_roles("admin"))):
    inv = await db.invoices.find_one({"id": iid}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Invoice not found")
    if inv.get("amount_paid", 0) > 0 or await db.payments.count_documents({"invoice_id": iid}):
        raise HTTPException(400, "This invoice has payments and can't be deleted")
    await db.invoices.delete_one({"id": iid})
    return {"ok": True}


@router.post("/payments")
async def record_payment(payload: PaymentRecord, current=Depends(require_roles("admin"))):
    inv = await db.invoices.find_one({"id": payload.invoice_id})
    if not inv:
        raise HTTPException(404, "Invoice not found")
    p = {
        "id": new_id(),
        "invoice_id": payload.invoice_id,
        "amount": payload.amount,
        "method": payload.method,
        "reference_number": payload.reference_number,
        "paid_at": now_iso(),
        "recorded_by": current["id"],
        "notes": payload.notes,
    }
    await db.payments.insert_one(p)
    paid = inv.get("amount_paid", 0) + payload.amount
    balance = inv["total_amount"] - paid
    status = "paid" if balance <= 0 else "partial"
    await db.invoices.update_one(
        {"id": payload.invoice_id},
        {"$set": {"amount_paid": paid, "balance_due": max(0, balance), "status": status, "payment_method": payload.method}},
    )
    p.pop("_id", None)
    return p


@router.get("/payments")
async def list_payments(invoice_id: Optional[str] = None, current=Depends(get_current_user)):
    q = {}
    if invoice_id:
        q["invoice_id"] = invoice_id
    return await db.payments.find(q, {"_id": 0}).sort("paid_at", -1).to_list(500)
