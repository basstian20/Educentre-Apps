# EduCentre — Bimbel Management System

## Original Problem Statement
Build a comprehensive education centre management app for Indonesian Bimbel (tutoring centre) market.

## User Personas (from artifacts)
1. **[M] Sari Dewi** — Centre Manager/Owner. Mobile + laptop. Goal: automate billing, live financial insight.
2. **[E] Pak Fariz Abdullah** — Full-time educator. Phone-first. Goal: focus on teaching, fast attendance.
3. **[S] Aiman Haziq** — Y5 student. iPhone. Goal: instant results, materials, self-pay.
4. **[P] Ibu Nurhayati** — Working parent of 2 kids. Goal: real-time alerts, combined payments.

## Architecture
- **Backend**: FastAPI + MongoDB (motor). JWT auth (httpOnly cookies + Bearer). bcrypt hashing.
- **Frontend**: React 19 + Tailwind + shadcn/ui + sonner toasts + recharts. Outfit + Plus Jakarta Sans fonts.
- **i18n**: EN + Bahasa Indonesia toggle (LangContext, persisted to localStorage).
- **Theme**: Light content with dark sidebar (#0F172A). Role color coding: Admin blue, Educator emerald, Student amber, Parent purple.

## What's Implemented (2026-05)
- ✅ JWT auth: login, logout, /me, role-protected endpoints. Demo-account quick-fill on login.
- ✅ Bilingual EN/ID with switcher in topbar.
- ✅ Role-aware dashboards: 4 distinct dashboards with stats + announcements.
- ✅ Students: CRUD list with search/filter, add modal, status badges.
- ✅ Educators: list + add modal with subjects.
- ✅ Parents: list + add modal with children linking.
- ✅ Classes: card grid + weekly timetable visualization.
- ✅ Enrollment: 4-step wizard (Student → Courses → Fee Plan → Confirm).
- ✅ Attendance: mark per-session grid (Present/Late/Absent/Excused) with date picker.
- ✅ Grades: assessment creation, bulk grade entry, publish toggle.
- ✅ Results: published grades visible to students/parents.
- ✅ Materials: upload (link/file/video), browse by role.
- ✅ Invoices: create + list with status; mark-paid (mock payment recording with method).
- ✅ Announcements: create + view with audience targeting.
- ✅ Reports: KPI tiles + class utilisation BarChart + invoice status PieChart.
- ✅ Seed: 1 admin, 2 educators, 1 parent, 2 students, 4 classes, 2 invoices, 1 published assessment+grade, sample attendance, 1 material, 1 announcement.

## Test Credentials (`/app/memory/test_credentials.md`)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@educentre.id | admin123 |
| Educator | fariz@educentre.id | educator123 |
| Educator | noor@educentre.id | educator123 |
| Parent | ibu.nur@educentre.id | parent123 |
| Student | aiman@educentre.id | student123 |
| Student | nurul@educentre.id | student123 |

## Backlog (P1/P2)
- P1: Real WhatsApp/email notifications (Twilio/SendGrid)
- P1: File upload (object storage) for materials & document attachments
- P1: Stripe/Midtrans/Xendit payment gateway
- P2: HR/Payroll module (educator payslips, leave requests)
- P2: Re-enrollment flow at term end
- P2: Multi-branch support
- P2: Audit log viewer UI
- P2: Excel/PDF export for reports & report cards
- P2: WhatsApp blast for announcements
- P2: QR code self-check-in for students
- P2: Direct messaging (educator ↔ parent)

## Notes
- Mocked: payment recording (admin marks as paid, no real gateway).
- In-app notifications only (no email/WhatsApp wiring yet).
- Single-centre tenancy; multi-branch deferred.
