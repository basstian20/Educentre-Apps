"""EduCentre FastAPI server."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
from datetime import datetime, timezone, date
from typing import List, Optional

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    require_roles,
)
from models import (
    LoginInput,
    RegisterInput,
    StudentCreate,
    StudentUpdate,
    EducatorCreate,
    ParentCreate,
    ClassCreate,
    ClassUpdate,
    EnrollmentCreate,
    AttendanceMark,
    InvoiceCreate,
    PaymentRecord,
    AssessmentCreate,
    GradeBulkSave,
    AssessmentPublish,
    MaterialCreate,
    AnnouncementCreate,
)

# ── DB ──
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ── App ──
app = FastAPI(title="EduCentre API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("educentre")


# ── Helpers ──
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def _set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=False, samesite="lax", max_age=12 * 3600, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=False, samesite="lax", max_age=7 * 86400, path="/")


def _clear_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


async def _gen_student_code():
    count = await db.students.count_documents({})
    return f"SC-{datetime.now().year}-{(count + 1):04d}"


async def _gen_educator_code():
    count = await db.educators.count_documents({})
    return f"EDU-{datetime.now().year}-{(count + 1):04d}"


async def _gen_invoice_number():
    count = await db.invoices.count_documents({})
    return f"INV-{datetime.now().year}-{(count + 1):05d}"


# ── Health ──
@api.get("/")
async def root():
    return {"message": "EduCentre API", "status": "ok"}


# ── Auth ──
@api.post("/auth/login")
async def login(payload: LoginInput, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account disabled")
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    _set_auth_cookies(response, access, refresh)
    user.pop("password_hash", None)
    return {"user": user, "access_token": access}


@api.post("/auth/logout")
async def logout(response: Response):
    _clear_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(current=Depends(get_current_user)):
    return current


@api.post("/auth/register")
async def register(payload: RegisterInput, response: Response, current=Depends(require_roles("admin"))):
    """Admin-only endpoint to create user accounts."""
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "id": new_id(),
        "email": email,
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name,
        "role": payload.role,
        "phone": payload.phone,
        "is_active": True,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    return user_doc


# ── Users (admin) ──
@api.get("/users")
async def list_users(role: Optional[str] = None, current=Depends(require_roles("admin"))):
    q = {}
    if role:
        q["role"] = role
    users = await db.users.find(q, {"_id": 0, "password_hash": 0}).to_list(500)
    return users


# ── Students ──
@api.post("/students")
async def create_student(payload: StudentCreate, current=Depends(require_roles("admin"))):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already exists")

    user_id = new_id()
    student_id = new_id()
    code = await _gen_student_code()

    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name,
        "role": "student",
        "phone": payload.phone,
        "is_active": True,
        "created_at": now_iso(),
    }
    student_doc = {
        "id": student_id,
        "user_id": user_id,
        "student_code": code,
        "full_name": payload.full_name,
        "email": email,
        "phone": payload.phone,
        "dob": payload.dob,
        "gender": payload.gender,
        "school_name": payload.school_name,
        "school_year": payload.school_year,
        "address": payload.address,
        "parent_id": payload.parent_id,
        "medical_notes": payload.medical_notes,
        "status": "active",
        "enrolled_at": now_iso(),
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    await db.students.insert_one(student_doc)
    student_doc.pop("_id", None)
    return student_doc


@api.get("/students")
async def list_students(search: Optional[str] = None, status: Optional[str] = None, current=Depends(get_current_user)):
    role = current["role"]
    q = {}
    if role == "student":
        q["user_id"] = current["id"]
    elif role == "parent":
        q["parent_id"] = current["id"]
    elif role == "educator":
        # educators see students from their classes
        my_classes = await db.classes.find({"educator_id": current["id"]}, {"_id": 0, "id": 1}).to_list(500)
        class_ids = [c["id"] for c in my_classes]
        enrollments = await db.enrollments.find({"class_id": {"$in": class_ids}, "status": "active"}, {"_id": 0, "student_id": 1}).to_list(2000)
        student_ids = list({e["student_id"] for e in enrollments})
        q["id"] = {"$in": student_ids}

    if status:
        q["status"] = status
    if search:
        q["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"student_code": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    students = await db.students.find(q, {"_id": 0}).to_list(500)
    return students


@api.get("/students/{sid}")
async def get_student(sid: str, current=Depends(get_current_user)):
    student = await db.students.find_one({"id": sid}, {"_id": 0})
    if not student:
        raise HTTPException(404, "Student not found")
    return student


@api.patch("/students/{sid}")
async def update_student(sid: str, payload: StudentUpdate, current=Depends(require_roles("admin"))):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    await db.students.update_one({"id": sid}, {"$set": update})
    return await db.students.find_one({"id": sid}, {"_id": 0})


# ── Educators ──
@api.post("/educators")
async def create_educator(payload: EducatorCreate, current=Depends(require_roles("admin"))):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    user_id = new_id()
    educator_id = new_id()
    code = await _gen_educator_code()
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name,
        "role": "educator",
        "phone": payload.phone,
        "is_active": True,
        "created_at": now_iso(),
    }
    edu_doc = {
        "id": educator_id,
        "user_id": user_id,
        "staff_code": code,
        "full_name": payload.full_name,
        "email": email,
        "phone": payload.phone,
        "subjects": payload.subjects,
        "employment_type": payload.employment_type,
        "qualifications": payload.qualifications,
        "status": "active",
        "hire_date": now_iso(),
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    await db.educators.insert_one(edu_doc)
    edu_doc.pop("_id", None)
    return edu_doc


@api.get("/educators")
async def list_educators(current=Depends(get_current_user)):
    educators = await db.educators.find({}, {"_id": 0}).to_list(200)
    return educators


# ── Parents ──
@api.post("/parents")
async def create_parent(payload: ParentCreate, current=Depends(require_roles("admin"))):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    user_id = new_id()
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name,
        "role": "parent",
        "phone": payload.phone,
        "is_active": True,
        "created_at": now_iso(),
    }
    parent_doc = {
        "id": new_id(),
        "user_id": user_id,
        "full_name": payload.full_name,
        "email": email,
        "phone": payload.phone,
        "occupation": payload.occupation,
        "children_ids": payload.children_ids,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    await db.parents.insert_one(parent_doc)
    # Update student parent_id linkage
    if payload.children_ids:
        await db.students.update_many({"id": {"$in": payload.children_ids}}, {"$set": {"parent_id": user_id}})
    parent_doc.pop("_id", None)
    return parent_doc


@api.get("/parents")
async def list_parents(current=Depends(require_roles("admin"))):
    return await db.parents.find({}, {"_id": 0}).to_list(200)


# ── Classes ──
@api.post("/classes")
async def create_class(payload: ClassCreate, current=Depends(require_roles("admin"))):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["is_active"] = True
    doc["created_at"] = now_iso()
    await db.classes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/classes")
async def list_classes(current=Depends(get_current_user)):
    role = current["role"]
    q = {"is_active": True}
    classes = await db.classes.find(q, {"_id": 0}).to_list(500)
    if role == "educator":
        classes = [c for c in classes if c.get("educator_id") == current["id"]]
    elif role == "student":
        student = await db.students.find_one({"user_id": current["id"]}, {"_id": 0, "id": 1})
        if not student:
            return []
        enrolls = await db.enrollments.find({"student_id": student["id"], "status": "active"}, {"_id": 0, "class_id": 1}).to_list(200)
        cids = [e["class_id"] for e in enrolls]
        classes = [c for c in classes if c["id"] in cids]
    elif role == "parent":
        kids = await db.students.find({"parent_id": current["id"]}, {"_id": 0, "id": 1}).to_list(50)
        kid_ids = [k["id"] for k in kids]
        enrolls = await db.enrollments.find({"student_id": {"$in": kid_ids}, "status": "active"}, {"_id": 0, "class_id": 1}).to_list(500)
        cids = list({e["class_id"] for e in enrolls})
        classes = [c for c in classes if c["id"] in cids]
    # enrich educator name + enrolled count
    edu_ids = list({c.get("educator_id") for c in classes if c.get("educator_id")})
    edus = await db.educators.find({"id": {"$in": edu_ids}}, {"_id": 0, "id": 1, "full_name": 1}).to_list(500)
    edu_map = {e["id"]: e["full_name"] for e in edus}
    for c in classes:
        c["educator_name"] = edu_map.get(c.get("educator_id"), "—")
        c["enrolled_count"] = await db.enrollments.count_documents({"class_id": c["id"], "status": "active"})
    return classes


@api.get("/classes/{cid}")
async def get_class(cid: str, current=Depends(get_current_user)):
    c = await db.classes.find_one({"id": cid}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Class not found")
    return c


@api.patch("/classes/{cid}")
async def update_class(cid: str, payload: ClassUpdate, current=Depends(require_roles("admin"))):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    await db.classes.update_one({"id": cid}, {"$set": update})
    return await db.classes.find_one({"id": cid}, {"_id": 0})


@api.delete("/classes/{cid}")
async def delete_class(cid: str, current=Depends(require_roles("admin"))):
    await db.classes.update_one({"id": cid}, {"$set": {"is_active": False}})
    return {"ok": True}


# ── Enrollment ──
@api.post("/enrollments")
async def create_enrollment(payload: EnrollmentCreate, current=Depends(require_roles("admin"))):
    existing = await db.enrollments.find_one({"student_id": payload.student_id, "class_id": payload.class_id, "status": "active"})
    if existing:
        raise HTTPException(400, "Already enrolled in this class")
    klass = await db.classes.find_one({"id": payload.class_id})
    if not klass:
        raise HTTPException(404, "Class not found")
    count = await db.enrollments.count_documents({"class_id": payload.class_id, "status": "active"})
    if count >= klass.get("capacity", 99):
        raise HTTPException(400, "Class is full")
    doc = {
        "id": new_id(),
        "student_id": payload.student_id,
        "class_id": payload.class_id,
        "status": "active",
        "enrolled_at": now_iso(),
        "enrolled_by": current["id"],
    }
    await db.enrollments.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/enrollments")
async def list_enrollments(student_id: Optional[str] = None, class_id: Optional[str] = None, current=Depends(get_current_user)):
    q = {}
    if student_id:
        q["student_id"] = student_id
    if class_id:
        q["class_id"] = class_id
    return await db.enrollments.find(q, {"_id": 0}).to_list(500)


@api.delete("/enrollments/{eid}")
async def withdraw_enrollment(eid: str, current=Depends(require_roles("admin"))):
    await db.enrollments.update_one({"id": eid}, {"$set": {"status": "withdrawn", "withdrawn_at": now_iso()}})
    return {"ok": True}


# ── Attendance ──
@api.post("/attendance")
async def mark_attendance(payload: AttendanceMark, current=Depends(require_roles("admin", "educator"))):
    # remove existing for same class+date and insert fresh
    await db.attendance.delete_many({"class_id": payload.class_id, "session_date": payload.session_date})
    docs = []
    for r in payload.records:
        docs.append({
            "id": new_id(),
            "class_id": payload.class_id,
            "session_date": payload.session_date,
            "student_id": r["student_id"],
            "status": r.get("status", "present"),
            "note": r.get("note"),
            "marked_by": current["id"],
            "marked_at": now_iso(),
        })
    if docs:
        await db.attendance.insert_many(docs)
    for d in docs:
        d.pop("_id", None)
    return {"count": len(docs), "records": docs}


@api.get("/attendance")
async def list_attendance(class_id: Optional[str] = None, student_id: Optional[str] = None, session_date: Optional[str] = None, current=Depends(get_current_user)):
    q = {}
    if class_id:
        q["class_id"] = class_id
    if student_id:
        q["student_id"] = student_id
    if session_date:
        q["session_date"] = session_date
    return await db.attendance.find(q, {"_id": 0}).sort("session_date", -1).to_list(2000)


# ── Invoices ──
@api.post("/invoices")
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


@api.get("/invoices")
async def list_invoices(student_id: Optional[str] = None, status: Optional[str] = None, current=Depends(get_current_user)):
    q = {}
    role = current["role"]
    if role == "student":
        s = await db.students.find_one({"user_id": current["id"]}, {"_id": 0, "id": 1})
        if not s:
            return []
        q["student_id"] = s["id"]
    elif role == "parent":
        kids = await db.students.find({"parent_id": current["id"]}, {"_id": 0, "id": 1}).to_list(50)
        q["student_id"] = {"$in": [k["id"] for k in kids]}
    elif role == "educator":
        return []
    if student_id and role == "admin":
        q["student_id"] = student_id
    if status:
        q["status"] = status
    invoices = await db.invoices.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    # auto-update overdue
    today = date.today().isoformat()
    for inv in invoices:
        if inv["status"] in ("unpaid", "partial") and inv["due_date"] < today:
            inv["status"] = "overdue"
    return invoices


@api.get("/invoices/{iid}")
async def get_invoice(iid: str, current=Depends(get_current_user)):
    inv = await db.invoices.find_one({"id": iid}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Invoice not found")
    return inv


@api.post("/payments")
async def record_payment(payload: PaymentRecord, current=Depends(get_current_user)):
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


@api.get("/payments")
async def list_payments(invoice_id: Optional[str] = None, current=Depends(get_current_user)):
    q = {}
    if invoice_id:
        q["invoice_id"] = invoice_id
    return await db.payments.find(q, {"_id": 0}).sort("paid_at", -1).to_list(500)


# ── Assessments & Grades ──
@api.post("/assessments")
async def create_assessment(payload: AssessmentCreate, current=Depends(require_roles("admin", "educator"))):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["is_published"] = False
    doc["created_by"] = current["id"]
    doc["created_at"] = now_iso()
    await db.assessments.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/assessments")
async def list_assessments(class_id: Optional[str] = None, current=Depends(get_current_user)):
    q = {}
    if class_id:
        q["class_id"] = class_id
    return await db.assessments.find(q, {"_id": 0}).sort("assessment_date", -1).to_list(500)


@api.post("/grades")
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
    if pct >= 90: return "A"
    if pct >= 80: return "A-"
    if pct >= 75: return "B+"
    if pct >= 70: return "B"
    if pct >= 65: return "B-"
    if pct >= 60: return "C+"
    if pct >= 50: return "C"
    if pct >= 40: return "D"
    return "F"


@api.get("/grades")
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


@api.post("/assessments/publish")
async def publish_assessment(payload: AssessmentPublish, current=Depends(require_roles("admin", "educator"))):
    await db.assessments.update_one(
        {"id": payload.assessment_id},
        {"$set": {"is_published": True, "published_at": now_iso(), "published_by": current["id"]}},
    )
    return {"ok": True}


# ── Materials ──
@api.post("/materials")
async def create_material(payload: MaterialCreate, current=Depends(require_roles("admin", "educator"))):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["uploaded_by"] = current["id"]
    doc["uploader_name"] = current["full_name"]
    doc["created_at"] = now_iso()
    await db.materials.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/materials")
async def list_materials(class_id: Optional[str] = None, current=Depends(get_current_user)):
    q = {}
    role = current["role"]
    if class_id:
        q["class_id"] = class_id
    elif role == "student":
        s = await db.students.find_one({"user_id": current["id"]}, {"_id": 0, "id": 1})
        if not s:
            return []
        enrolls = await db.enrollments.find({"student_id": s["id"], "status": "active"}, {"_id": 0, "class_id": 1}).to_list(50)
        q["class_id"] = {"$in": [e["class_id"] for e in enrolls]}
    elif role == "parent":
        kids = await db.students.find({"parent_id": current["id"]}, {"_id": 0, "id": 1}).to_list(50)
        enrolls = await db.enrollments.find({"student_id": {"$in": [k["id"] for k in kids]}, "status": "active"}, {"_id": 0, "class_id": 1}).to_list(200)
        q["class_id"] = {"$in": list({e["class_id"] for e in enrolls})}
    elif role == "educator":
        my_classes = await db.classes.find({"educator_id": current["id"]}, {"_id": 0, "id": 1}).to_list(50)
        q["class_id"] = {"$in": [c["id"] for c in my_classes]}
    return await db.materials.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.delete("/materials/{mid}")
async def delete_material(mid: str, current=Depends(require_roles("admin", "educator"))):
    await db.materials.delete_one({"id": mid})
    return {"ok": True}


# ── Announcements ──
@api.post("/announcements")
async def create_announcement(payload: AnnouncementCreate, current=Depends(require_roles("admin", "educator"))):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["created_by"] = current["id"]
    doc["created_by_name"] = current["full_name"]
    doc["created_at"] = now_iso()
    await db.announcements.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/announcements")
async def list_announcements(current=Depends(get_current_user)):
    role = current["role"]
    role_to_audience = {"admin": ["all"], "educator": ["all", "educators"], "student": ["all", "students"], "parent": ["all", "parents"]}
    audiences = role_to_audience.get(role, ["all"])
    docs = await db.announcements.find({"audience": {"$in": audiences + ["class"]}}, {"_id": 0}).sort("created_at", -1).to_list(200)
    # filter class-specific
    if role in ("student", "educator", "parent"):
        # find class ids the user has access to
        class_ids = set()
        if role == "educator":
            cs = await db.classes.find({"educator_id": current["id"]}, {"_id": 0, "id": 1}).to_list(50)
            class_ids = {c["id"] for c in cs}
        elif role == "student":
            s = await db.students.find_one({"user_id": current["id"]}, {"_id": 0, "id": 1})
            if s:
                es = await db.enrollments.find({"student_id": s["id"], "status": "active"}, {"_id": 0, "class_id": 1}).to_list(50)
                class_ids = {e["class_id"] for e in es}
        elif role == "parent":
            kids = await db.students.find({"parent_id": current["id"]}, {"_id": 0, "id": 1}).to_list(50)
            es = await db.enrollments.find({"student_id": {"$in": [k["id"] for k in kids]}, "status": "active"}, {"_id": 0, "class_id": 1}).to_list(200)
            class_ids = {e["class_id"] for e in es}
        docs = [d for d in docs if d.get("audience") != "class" or d.get("class_id") in class_ids]
    return docs


# ── Dashboard stats ──
@api.get("/dashboard/stats")
async def dashboard_stats(current=Depends(get_current_user)):
    role = current["role"]
    today = date.today().isoformat()

    if role == "admin":
        students_count = await db.students.count_documents({"status": "active"})
        classes_count = await db.classes.count_documents({"is_active": True})
        educators_count = await db.educators.count_documents({"status": "active"})
        invoices = await db.invoices.find({}, {"_id": 0}).to_list(2000)
        outstanding = sum(i.get("balance_due", 0) for i in invoices if i["status"] != "paid")
        revenue_this_month = 0
        ym = today[:7]
        payments = await db.payments.find({}, {"_id": 0}).to_list(2000)
        revenue_this_month = sum(p["amount"] for p in payments if (p.get("paid_at") or "")[:7] == ym)
        overdue_count = sum(1 for i in invoices if i["status"] == "overdue" or (i["status"] in ("unpaid", "partial") and i["due_date"] < today))
        return {
            "active_students": students_count,
            "active_classes": classes_count,
            "active_educators": educators_count,
            "outstanding_fees": outstanding,
            "revenue_this_month": revenue_this_month,
            "overdue_invoices": overdue_count,
        }

    if role == "educator":
        my_classes = await db.classes.find({"educator_id": current["id"], "is_active": True}, {"_id": 0}).to_list(50)
        cids = [c["id"] for c in my_classes]
        enrolls = await db.enrollments.count_documents({"class_id": {"$in": cids}, "status": "active"})
        ass = await db.assessments.find({"class_id": {"$in": cids}, "is_published": False}, {"_id": 0}).to_list(50)
        return {
            "my_classes": len(my_classes),
            "total_students": enrolls,
            "pending_assessments": len(ass),
            "today_classes": [c for c in my_classes if _today_dow() in (c.get("schedule_days") or [])],
        }

    if role == "student":
        s = await db.students.find_one({"user_id": current["id"]}, {"_id": 0})
        if not s:
            return {}
        enrolls = await db.enrollments.find({"student_id": s["id"], "status": "active"}, {"_id": 0}).to_list(50)
        cids = [e["class_id"] for e in enrolls]
        my_classes = await db.classes.find({"id": {"$in": cids}}, {"_id": 0}).to_list(50)
        invs = await db.invoices.find({"student_id": s["id"]}, {"_id": 0}).to_list(50)
        outstanding = sum(i.get("balance_due", 0) for i in invs if i["status"] != "paid")
        att = await db.attendance.find({"student_id": s["id"]}, {"_id": 0}).to_list(500)
        present = sum(1 for a in att if a["status"] == "present")
        return {
            "active_classes": len(my_classes),
            "today_classes": [c for c in my_classes if _today_dow() in (c.get("schedule_days") or [])],
            "outstanding_fees": outstanding,
            "attendance_pct": round(present / len(att) * 100, 1) if att else 100,
            "student": s,
        }

    if role == "parent":
        kids = await db.students.find({"parent_id": current["id"]}, {"_id": 0}).to_list(20)
        kid_ids = [k["id"] for k in kids]
        enrolls = await db.enrollments.find({"student_id": {"$in": kid_ids}, "status": "active"}, {"_id": 0}).to_list(200)
        cids = list({e["class_id"] for e in enrolls})
        my_classes = await db.classes.find({"id": {"$in": cids}}, {"_id": 0}).to_list(50)
        invs = await db.invoices.find({"student_id": {"$in": kid_ids}}, {"_id": 0}).to_list(200)
        outstanding = sum(i.get("balance_due", 0) for i in invs if i["status"] != "paid")
        att = await db.attendance.find({"student_id": {"$in": kid_ids}}, {"_id": 0}).to_list(500)
        present = sum(1 for a in att if a["status"] == "present")
        return {
            "children_count": len(kids),
            "children": kids,
            "active_classes": len(my_classes),
            "outstanding_fees": outstanding,
            "attendance_pct": round(present / len(att) * 100, 1) if att else 100,
            "today_classes": [c for c in my_classes if _today_dow() in (c.get("schedule_days") or [])],
        }
    return {}


def _today_dow():
    # 1=Mon..7=Sun (matching wireframes)
    return datetime.now().isoweekday()


# ── Mount router ──
app.include_router(api)

_origin_regex = r"https?://(localhost(:\d+)?|.*\.preview\.emergentagent\.com)"
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    # indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.students.create_index("id", unique=True)
    await db.students.create_index("user_id")
    await db.educators.create_index("id", unique=True)
    await db.classes.create_index("id", unique=True)
    await db.enrollments.create_index([("student_id", 1), ("class_id", 1)])
    await db.attendance.create_index([("class_id", 1), ("session_date", 1), ("student_id", 1)])
    await db.invoices.create_index("invoice_number", unique=True)

    # seed
    from seed import seed_all
    await seed_all(db)
    logger.info("Startup complete")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
