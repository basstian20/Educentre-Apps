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
)

app = FastAPI(title="EduCentre API")
api = APIRouter(prefix="/api")

# Order matters only for overlapping paths; keep it identical to the pre-split server.py.
for _module in (
    health, auth, users, students, educators, parents, classes, enrollments, attendance,
    invoices, grades, materials, announcements, uploads, settings, reports, notifications, dashboard,
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

app.include_router(api)


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
    # login_guard: rows expire on their own once the lock/failure window has passed
    await db.login_attempts.create_index("expires_at", expireAfterSeconds=0)

    # seed
    from seed import seed_all
    await seed_all(db)
    logger.info("Startup complete")


@app.on_event("shutdown")
async def on_shutdown():
    close_client()
