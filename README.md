# EduCentre — Course Centre Management System

A full stack web application for managing private course and tuition centres. Built to replace WhatsApp groups and Excel spreadsheets with a unified platform for management, educators, students, and parents.

🔗 **[View Live Demo](https://educentre-apps.vercel.app/)**

---

## What It Does

EduCentre connects all four roles in a course centre under one system:

- **Admin** — manages the entire centre: students, educators, classes, fees, and announcements
- **Educators** — view their classes, mark attendance, create assessments, and upload materials
- **Students** — track their schedule, attendance record, grades, and outstanding fees
- **Parents** — monitor their children's attendance, grades, and invoices in real time

---

## Features

| Module | What it covers |
|---|---|
| **Student Management** | Enrolment, profiles, student codes, status tracking |
| **Class Scheduling** | Create classes, assign educators, set capacity and schedule |
| **Attendance** | Mark per-session attendance, view history, calculate percentages |
| **Fee & Invoicing** | Generate invoices, record payments, track overdue balances |
| **Assessments & Grades** | Create assessments, enter grades, publish results to students/parents |
| **Learning Materials** | Upload and share class materials by role |
| **Announcements** | Broadcast to all, or target educators/students/parents/specific classes |
| **Dashboard** | Role-specific stats — each role sees only what's relevant to them |

---

## Tech Stack

**Frontend**
- React (Create React App)
- Tailwind CSS + shadcn/ui
- Deployed on Vercel

**Backend**
- FastAPI (Python)
- Motor (async MongoDB driver)
- JWT authentication via HTTP-only cookies
- bcrypt password hashing

**Database**
- MongoDB

---

## Project Structure

```
educentre/
├── frontend/          # React app
│   ├── src/
│   └── .env           # REACT_APP_API_URL
├── backend/           # FastAPI server
│   ├── server.py      # Main API — all routes
│   ├── auth.py        # JWT & password utilities
│   ├── database.py    # MongoDB connection
│   ├── models.py      # Pydantic request models
│   ├── seed.py        # Database seeder with demo data
│   └── .env           # MONGO_URL, DB_NAME, JWT_SECRET
```

---

## Running Locally

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB (local or Atlas)

### 1. Clone the repo

```bash
git clone https://github.com/basstian20/Educentre-Apps.git
cd Educentre-Apps
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=educentre
JWT_SECRET=your_long_random_secret_here
```

Start the server:

```bash
uvicorn server:app --reload --port 8000
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` folder:

```
REACT_APP_API_URL=http://localhost:8000
```

Start the app:

```bash
npm start
```

The app will be running at `http://localhost:3000`.

---

## Demo Accounts

The database seeds automatically on first startup. Use these to explore each role:

| Role | Email | Password |
|---|---|---|
| Admin | admin@educentre.id | admin123 |
| Educator | fariz@educentre.id | educator123 |
| Student | aiman@educentre.id | student123 |
| Parent | ibu.nur@educentre.id | parent123 |

---

## API Overview

All routes are prefixed with `/api`. Authentication uses HTTP-only cookies set on login.

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/students
POST   /api/students
PATCH  /api/students/{id}

GET    /api/classes
POST   /api/classes
PATCH  /api/classes/{id}
DELETE /api/classes/{id}

POST   /api/attendance
GET    /api/attendance

GET    /api/invoices
POST   /api/invoices
POST   /api/payments

GET    /api/assessments
POST   /api/assessments
POST   /api/grades
POST   /api/assessments/publish

GET    /api/announcements
POST   /api/announcements

GET    /api/dashboard/stats
```

Full interactive docs available at `http://localhost:8000/docs` when running locally (FastAPI auto-generates Swagger UI).

---

## Background

This project was built as a portfolio piece to demonstrate full stack capability across a real-world domain. Course centres in Indonesia commonly manage hundreds of students using only WhatsApp and spreadsheets — EduCentre is designed to solve that exact problem at an accessible price point.

---

## Author

**Bastian** — Full Stack Developer  
Portfolio: [niceguydev.com](https://niceguydev.com) *(coming soon)*  
Email: tyanz85@gmail.com

