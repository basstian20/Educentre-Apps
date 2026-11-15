# EduCentre: Technical Case Study

**A multi-role management platform for private tutoring centres (bimbel)**

| | |
|---|---|
| **Type** | Full-stack web application (portfolio product, not yet used by a real client) |
| **Role** | Solo full-stack developer and UI/UX designer |
| **Live demo** | https://educentre-apps.vercel.app/ |
| **Source** | https://github.com/basstian20/Educentre-Apps |
| **Timeline** | April 2026 to November 2026 (96 commits) |
| **Stack** | React 19, Tailwind CSS, shadcn/ui, FastAPI, MongoDB (Motor), JWT, Vercel |

---

## 1. The Problem

Small private tutoring centres in Indonesia usually run on WhatsApp groups and Excel sheets:

- Attendance is reported in chat and re-typed into a spreadsheet later.
- Grades and invoices live in separate files, so nobody has one view of a student.
- Parents message the office to ask whether their child attended or whether a fee is paid.
- There is no access control: anyone with the spreadsheet sees everything.

## 2. The Solution

One system where **four roles** share the same data but each sees only what concerns them.

| Role | What they do |
|---|---|
| **Admin** | Manages students, educators, parents, classes, enrolment, invoices and payments, announcements, reports and centre settings. Imports students from CSV. Unlocks locked accounts. |
| **Educator** | Marks attendance per session, creates assessments, enters and publishes grades, uploads materials. Designed phone-first. |
| **Student** | Sees schedule, attendance, published grades, materials, invoices and report card. |
| **Parent** | Monitors several children at once: attendance, grades and invoices. |

## 3. Scope at a Glance

| Metric | Value |
|---|---|
| REST endpoints | about 60, across 19 domain routers |
| Pydantic request models | 30+ |
| Frontend pages | 19 (including print views for invoice and report card) |
| UI components | shadcn/ui primitives plus custom layout, command palette, notification bell, table tools |
| Automated tests | about 70 test functions (backend) plus CI on every pull request |
| Languages | Bahasa Indonesia (default) and English, switchable at runtime |
| Seed data | 50 students, educators, parents and 6 months of attendance, grades and invoices |

## 4. Architecture

```
┌──────────────────────┐        HTTPS + HTTP-only cookies        ┌─────────────────────────┐
│  React 19 (CRA)      │ ─────────────────────────────────────▶ │  FastAPI (uvicorn)      │
│  Tailwind + shadcn   │ ◀───────────────────────────────────── │  19 routers + auth      │
│  axios, zod, RHF     │              JSON / files               │  login_guard, mailer    │
│  Vercel              │                                         └───────────┬─────────────┘
└──────────────────────┘                                                     │ Motor (async)
                                                                  ┌──────────▼─────────────┐
                                                                  │  MongoDB (Atlas)       │
                                                                  └────────────────────────┘
```

### Backend structure

`server.py` is an entry point only. It builds the app, wires CORS, mounts one router per domain, creates indexes and seeds the demo data on startup. Shared state and helpers live in `core.py`.

```
backend/
├── server.py          # app, middleware, router mounting, startup indexes
├── core.py            # shared db handle, logger, id/code generators, cookie helpers
├── auth.py            # bcrypt hashing, JWT creation/verification, role guards
├── login_guard.py     # brute-force protection
├── password_reset.py  # one-time reset links
├── mailer.py          # console / SMTP email behind one function
├── database.py        # Motor connection with retry and DNS fallback
├── models.py          # Pydantic request models
├── routers/           # students, educators, parents, classes, enrollments, attendance,
│                      # invoices, grades, materials, announcements, notifications,
│                      # reports, dashboard, settings, uploads, auth, users, health
├── seed.py            # base demo data
├── seed_6bulan.py     # 6-month sample data with dry-run, backup and rollback
└── tests/             # pytest suite with isolated database
```

### Frontend structure

React Router with role-aware routes. A thin `api.js` wraps axios (cookies plus a Bearer fallback). Server error messages are mapped to Indonesian when that language is active. Custom hooks and libs cover auth, theme, motion, i18n, CSV parsing and load/error/empty states.

## 5. Data Model

MongoDB with one collection per domain object (about 18 collections), including:

`users`, `students`, `educators`, `parents`, `classes`, `enrollments`, `attendance`, `invoices`, `payments`, `assessments`, `grades`, `materials`, `material_files`, `announcements`, `notifications`, `settings`, `login_attempts`, `password_resets`, `seed_manifest`.

Notable decisions:

- **Domain records are separate from login accounts.** A student, educator or parent record references a `users` document. Edits to name, phone or status are mirrored to the account by a `_sync_user` helper.
- **Readable business codes.** Students (`SC-2026-0001`), educators (`EDU-2026-0001`) and invoices (`INV-2026-00001`) get human-friendly numbers; the invoice number has a unique index.
- **Indexes match the real queries**, for example attendance by `(class_id, session_date, student_id)`, by `(student_id, session_date desc)` and by `session_date desc` for paginated history.
- **TTL indexes** (`expireAfterSeconds`) clear stale login-attempt and password-reset rows automatically.
- **Files stored in MongoDB** (5 MB limit) to keep the demo deployable without a separate object store.

## 6. Security

| Area | Implementation |
|---|---|
| Passwords | bcrypt hashing |
| Sessions | JWT access token (12 h) and refresh token (7 days) in **HTTP-only, Secure, SameSite=None cookies**; Bearer token fallback |
| Authorization | Role guard dependency (`require_roles`) on every protected route; per-role scoping of list endpoints (a parent only sees their own children's data) |
| File access | Material downloads re-check that the requesting student, parent or educator can see the owning material |
| Brute-force protection | 5 failed sign-ins per `ip+email` or 20 per `email` lock the account for 15 minutes; correct password is also rejected while locked and attempts during a lock are not counted; admin can list and lift locks. Unknown email and wrong password count the same, so account existence is not revealed |
| Password reset | One-time link, valid 30 minutes, max 3 per account per hour; only the **SHA-256 hash** of the token is stored; same response whether or not the email exists; requesting a new link revokes older ones |
| Reverse proxy | `TRUST_PROXY` setting to read the real client IP from `X-Forwarded-For` |
| Upload limits | 5 MB cap and empty-file rejection |

## 7. API Design

- RESTful resources with `GET / POST / PATCH / DELETE` and consistent status codes (400, 403, 404, 413, 429).
- Server-side pagination for attendance history, plus search and sorting on list endpoints.
- Bulk operations: student CSV import and bulk grade save.
- Printable document endpoints (`/invoices/{id}/document`, `/students/{id}/report`) that feed print-optimized views.
- A **route snapshot test** (`api_surface.json`) fails if an endpoint is added, removed or renamed unintentionally, which made the router refactor safe.

## 8. Frontend and UX

- **Mobile-first.** Tables turn into card layouts on phones; a bottom navigation bar serves educators and parents on small screens.
- **Bilingual.** Full Indonesian translation with an English toggle; Indonesian is the default because the target users are Indonesian.
- **Design system.** "Clay Soft" redesign delivered in 8 staged branches, each reviewed against a checklist before merging. Includes dark mode, motion with a reduced-motion toggle, a command palette, minimum 12 px text and plain print sheets.
- **Accessibility.** Keyboard-reachable controls, labelled inputs, readable contrast in both themes.
- **Resilience.** Every data screen has loading, empty and error states.
- **Print.** Invoices and report cards have dedicated print layouts.
- **Forms.** React Hook Form with Zod validation.
- **Data visualization.** Role-specific dashboards using Recharts.

## 9. Testing and CI

- **pytest** suite started against a **throw-away database** (`edu_test`, dropped afterwards) so demo data is never touched.
- Coverage areas: core CRUD flows, per-role access on every router, login lockout, password reset, and the API route snapshot.
- **GitHub Actions** on every pull request and push to `main`:
  - Backend: pyflakes lint plus pytest against a MongoDB 7 service container.
  - Frontend: strict production build with `CI=true`, which treats React Hooks `exhaustive-deps` warnings as errors.
- A real CI failure (hook warnings breaking the build) was found and fixed in commit `f97a633`.

## 10. Deployment

| Part | Where |
|---|---|
| Frontend | Vercel |
| Backend | `uvicorn server:app` (Procfile), container- or PaaS-friendly |
| Database | MongoDB Atlas |
| Config | Environment variables: `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `FRONTEND_URL`, `MAIL_PROVIDER`, `SMTP_*`, `TRUST_PROXY`, login and reset tuning knobs |

## 11. Engineering Challenges and Decisions

1. **Splitting a monolith safely.** `server.py` grew too large. I split it into `core.py` and one router per domain. Before refactoring I added the API route snapshot test and per-role smoke tests, so the split could not change behaviour silently.
2. **Atlas connection reliability.** Free-tier clusters pause, and some networks cannot resolve the SRV/TXT records `mongodb+srv://` needs. `database.py` retries with a delay and falls back to public DNS resolvers once, configurable with `DNS_NAMESERVERS`.
3. **Cross-origin cookies.** The frontend (Vercel) and API live on different origins, so cookies use `Secure` and `SameSite=None`, and CORS is restricted to known origins.
4. **Brute-force protection without leaking information.** Two counters (`ip|email` and `email`) stop both single-source and IP-rotating attacks, and failures look identical for unknown emails and wrong passwords.
5. **Safe demo data.** `seed_6bulan.py` supports `--dry-run`, a backup before writing, and `--rollback` that removes exactly what was inserted (tracked in `seed_manifest`), so sample data can be added and removed without risk.
6. **Redesign without regressions.** The visual redesign ran in staged branches with a rule that features, data, copy and `data-testid` attributes do not change, and with final testing recorded in `docs/redesign/`.
7. **Role scoping.** Educator records have their own id that differs from the user id, so classes reference `educators.id`. Helper resolvers (`_resolve_educator_id`, `_resolve_student_id`) keep that mapping in one place.

## 12. Known Limitations (stated honestly)

- This is a **portfolio demo**: it has no live customers.
- Payments are **recorded manually by the admin**. There is no payment gateway.
- Notifications are **in-app only**. There is no WhatsApp or email broadcast.
- In the demo, the password-reset email goes to the server log (`MAIL_PROVIDER=console`), because the seeded addresses are not real mailboxes. SMTP is supported for production.
- Single-centre tenancy. Multi-branch, payroll/HR, QR check-in and direct messaging are not built.

## 13. Possible Next Steps

- Payment gateway integration (for example Midtrans or Xendit) with webhooks.
- WhatsApp or email notifications for absences and overdue invoices.
- Multi-branch tenancy.
- Move file storage from MongoDB to object storage (S3 or similar).
- Move to Vite or Next.js (Create React App is no longer actively maintained).

## 14. Skills Demonstrated

React, Tailwind CSS, shadcn/ui, Python, FastAPI, MongoDB and Motor, REST API design, JWT and cookie-based authentication, role-based access control, security hardening (rate limiting, token hashing), pytest, GitHub Actions CI, responsive and mobile-first design, internationalization, data visualization, print-friendly layouts, Vercel deployment, and Git workflow with one branch per feature.
