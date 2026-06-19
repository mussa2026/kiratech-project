# KIRATECH — Online Computing & IT Support Management System

A full-stack web application for managing IT support requests, technicians, and customers.

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS      |
| Backend     | Node.js, Express.js               |
| Database    | MySQL + Sequelize ORM             |
| Auth        | JWT + Email Verification          |
| Email       | Nodemailer (SMTP/Gmail)           |

---

## Project Structure

```
kiratech/
├── backend/          # Express API server
│   ├── models/       # Sequelize models
│   ├── routes/       # API route handlers
│   ├── middleware/   # Auth middleware
│   ├── utils/        # Email, helpers
│   └── scripts/      # Seed scripts
└── frontend/         # React SPA
    └── src/
        ├── pages/    # Page components
        ├── layouts/  # Dashboard layouts
        ├── components/
        ├── store/    # Zustand state
        └── lib/      # Axios instance
```

---

## Setup

### 1. Database
Create a MySQL database:
```sql
CREATE DATABASE kiratech_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env        # Fill in your values
npm run dev                  # Start dev server (port 5000)
node scripts/seed.js         # Seed services and admin account
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                  # Start Vite dev server (port 3000)
```

---

## Default Admin Account

After running `node scripts/seed.js`:

- **Email:** admin@kiratech.com
- **Password:** Admin@123456

---

## API Endpoints

| Method | Route                              | Access         |
|--------|------------------------------------|----------------|
| POST   | /api/auth/register                 | Public         |
| GET    | /api/auth/verify-email?token=...   | Public         |
| POST   | /api/auth/login                    | Public         |
| POST   | /api/auth/forgot-password          | Public         |
| POST   | /api/auth/reset-password           | Public         |
| GET    | /api/services                      | Public         |
| GET    | /api/user/requests                 | Customer       |
| POST   | /api/user/requests                 | Customer       |
| GET    | /api/technician/tasks              | Technician     |
| PUT    | /api/technician/tasks/:id/accept   | Technician     |
| PUT    | /api/technician/tasks/:id/status   | Technician     |
| GET    | /api/admin/dashboard-stats         | Admin          |
| GET    | /api/admin/requests                | Admin          |
| PUT    | /api/admin/requests/:id/assign     | Admin          |
| POST   | /api/admin/technicians             | Admin          |
| GET    | /api/admin/reports/summary         | Admin          |

---

## Services Included

**Standard:** Computer Maintenance, Printer Repair, Mobile Phone Repair, Network & WiFi Setup, Data Recovery, Software Installation, Hardware Upgrades

**Premium:** Remote Desktop Support, On-Call Priority Support, Live Service Tracking, Cloud Backup, Web Hosting

---

## User Roles

- **Customer** — Register, submit service requests, track status, view assigned technician, leave reviews
- **Technician** — View/accept/reject assigned tasks, update progress, complete jobs
- **Admin** — Full system control: users, technicians, requests, services, reports

---

## Workflow

```
Customer Registration
  → Email Verification
    → Login
      → Submit Service Request
        → Admin Receives Notification
          → Admin Assigns Technician
            → Technician Accepts / Starts Work
              → Service Completion
                → Customer Reviews
```
