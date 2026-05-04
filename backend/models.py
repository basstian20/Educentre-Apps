"""Pydantic models for EduCentre."""
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
import uuid


def _id() -> str:
    return str(uuid.uuid4())


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Auth ──
class LoginInput(BaseModel):
    email: EmailStr
    password: str


class RegisterInput(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str  # admin | educator | student | parent
    phone: Optional[str] = None


# ── User profile ──
class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


# ── Students ──
class StudentCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str = "student123"
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    school_name: Optional[str] = None
    school_year: Optional[str] = None
    address: Optional[str] = None
    parent_id: Optional[str] = None
    medical_notes: Optional[str] = None


class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    school_name: Optional[str] = None
    school_year: Optional[str] = None
    address: Optional[str] = None
    medical_notes: Optional[str] = None
    status: Optional[str] = None


# ── Educators ──
class EducatorCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str = "educator123"
    phone: Optional[str] = None
    subjects: List[str] = []
    employment_type: str = "full_time"
    qualifications: Optional[str] = None


# ── Parents ──
class ParentCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str = "parent123"
    phone: Optional[str] = None
    occupation: Optional[str] = None
    children_ids: List[str] = []


# ── Classes ──
class ClassCreate(BaseModel):
    subject_name: str
    level: str
    educator_id: str
    room: str
    description: Optional[str] = None
    color_hex: Optional[str] = "#3B82F6"
    capacity: int = 20
    fee_amount: float = 500000  # IDR
    schedule_days: List[int] = []  # 1=Mon..7=Sun
    time_start: str = "08:00"
    time_end: str = "09:30"


class ClassUpdate(BaseModel):
    subject_name: Optional[str] = None
    level: Optional[str] = None
    educator_id: Optional[str] = None
    room: Optional[str] = None
    description: Optional[str] = None
    color_hex: Optional[str] = None
    capacity: Optional[int] = None
    fee_amount: Optional[float] = None
    schedule_days: Optional[List[int]] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None


# ── Enrollment ──
class EnrollmentCreate(BaseModel):
    student_id: str
    class_id: str


# ── Attendance ──
class AttendanceMark(BaseModel):
    class_id: str
    session_date: str  # YYYY-MM-DD
    records: List[dict]  # [{student_id, status, note?}]


# ── Invoices ──
class InvoiceItem(BaseModel):
    description: str
    amount: float


class InvoiceCreate(BaseModel):
    student_id: str
    billing_month: str  # YYYY-MM
    items: List[InvoiceItem]
    due_date: str  # YYYY-MM-DD
    notes: Optional[str] = None


class PaymentRecord(BaseModel):
    invoice_id: str
    amount: float
    method: str = "cash"  # cash | bank_transfer | qris | ewallet
    reference_number: Optional[str] = None
    notes: Optional[str] = None


# ── Assessments ──
class AssessmentCreate(BaseModel):
    class_id: str
    name: str
    type: str = "quiz"  # quiz | test | assignment | project
    assessment_date: str
    max_score: float = 100
    pass_score: float = 50
    weightage: float = 10


class GradeEntry(BaseModel):
    student_id: str
    score: Optional[float] = None
    remark: Optional[str] = None
    is_absent: bool = False


class GradeBulkSave(BaseModel):
    assessment_id: str
    entries: List[GradeEntry]


class AssessmentPublish(BaseModel):
    assessment_id: str


# ── Materials ──
class MaterialCreate(BaseModel):
    class_id: str
    title: str
    type: str = "link"  # file | link | video
    external_url: Optional[str] = None
    file_url: Optional[str] = None
    description: Optional[str] = None


# ── Announcements ──
class AnnouncementCreate(BaseModel):
    title: str
    body: str
    audience: str = "all"  # all | parents | students | educators | class
    class_id: Optional[str] = None
