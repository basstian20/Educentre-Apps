"""EduCentre FastAPI server.

Entry point only: builds the app, wires middleware and mounts one router per domain
from `routers/`. Shared state and helpers live in `core.py`.
"""
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

from core import db, logger
from database import close_client
from routers import (
    health,
    auth,
    users,
    students,
    educators,
    parents,
    classes,
    enrollments,
    attendance,
    invoices,
    grades,
    materials,
    announcements,
    uploads,
    settings,
    reports,
    notifications,
    dashboard,
    trash,
    audit_logs,
)
import audit
import login_guard

app = FastAPI(title="EduCentre API")
api = APIRouter(prefix="/api")

# Order matters only for overlapping paths; keep it identical to the pre-split server.py.
for _module in (
    health, auth, users, students, educators, parents, classes, enrollments, attendance,
    invoices, grades, materials, announcements, uploads, settings, reports, notifications, dashboard, trash, audit_logs,
):
    api.include_router(_module.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://educentre-apps.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def remember_client_ip(request, call_next):
    """Make the caller's address available to audit.record() without threading Request through every route."""
    audit.set_client_ip(login_guard.client_ip(request))
    return await call_next(request)


app.include_router(api)


async def ensure_perf_indexes() -> None:
    """Indexes backing the list endpoints and dashboard aggregates (F0-8). create_index is idempotent."""
    await db.invoices.create_index([("student_id", 1), ("created_at", -1)])
    await db.invoices.create_index([("status", 1), ("due_date", 1)])
    await db.payments.create_index([("invoice_id", 1), ("paid_at", 1)])
    await db.payments.create_index([("paid_at", -1)])
    await db.grades.create_index([("assessment_id", 1), ("student_id", 1)])
    await db.grades.create_index([("student_id", 1)])
    await db.assessments.create_index([("class_id", 1)])
    await db.materials.create_index([("class_id", 1)])
    await db.announcements.create_index([("created_at", -1)])
    await db.enrollments.create_index([("class_id", 1), ("status", 1)])
    await db.students.create_index([("full_name", 1)])
    await db.students.create_index([("parent_id", 1)])
    await db.classes.create_index([("educator_id", 1)])


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
    await db.attendance.create_index([("student_id", 1), ("session_date", -1)])
    await db.attendance.create_index([("session_date", -1)])
    await db.invoices.create_index("invoice_number", unique=True)
    await ensure_perf_indexes()
    for _coll in (db.parents, db.announcements, db.materials, db.invoices):
        await _coll.create_index("deleted_at")
    # login_guard: rows expire on their own once the lock/failure window has passed
    await db.login_attempts.create_index("expires_at", expireAfterSeconds=0)
    await db.password_resets.create_index("purge_at", expireAfterSeconds=0)
    await db.password_resets.create_index([("user_id", 1), ("created_at", -1)])
    await audit.ensure_indexes()

    # seed
    from seed import seed_all
    await seed_all(db)
    logger.info("Startup complete")


@app.on_event("shutdown")
async def on_shutdown():
    close_client()
