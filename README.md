# HOSTLR

**Hostel Management System** — A full-stack MERN application for managing hostels, rooms, allotments, fees, complaints, and announcements.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Auth:** JWT (access + refresh tokens), bcrypt

## Features

### Role-Based Access
- **Admin** — Full access: users, hostels, rooms, allotments, fees, complaints, announcements, reports, settings
- **Warden** — Hostel operations: hostels, rooms, allotments, fees, complaints, announcements
- **Accountant** — Fee management: create fees, mark as paid
- **Student** — Personal view: my fees, my complaints, notices, profile settings

### Core Modules
- **Hostels** — CRUD with image support
- **Rooms** — Room management per hostel (available, full, maintenance)
- **Allotments** — Assign students to rooms
- **Fees** — Create fees, track pending/paid/overdue
- **Complaints** — Students submit; admin/warden resolve (with photo support)
- **Announcements** — Notices from admin/warden (pinnable, hostel-specific)
- **Users** — Admin manages users; warden registration requires admin approval
- **Leave / Outpass** — Students request leave; admin/warden approve; generates outpass code
- **Visitor Log** — Track visitors (check-in/out), who visits whom; students can log expected visitors

### Additional Features
- **Reports** — Analytics dashboard (hostels, rooms, students, occupancy, revenue, fees, complaints)
- **Settings** — Profile update (name, avatar, password)
- **Image Support** — Hostel images, user avatars, complaint photos (JPEG, PNG, GIF, WebP, max 5MB)
- **Dark Mode** — Theme toggle (sun/moon) in header; preference saved in localStorage

## Project Structure

```
hostlr/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Layout, UI components
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # Route pages
│   │   └── services/       # API client
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # DB, env
│   │   ├── modules/        # auth, users, hostels, rooms, allotments, fees, complaints, announcements, leaves, visitors, stats, upload
│   │   └── shared/         # middleware, utils
│   ├── scripts/
│   │   └── seed-admin.js   # Seed admin user
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
cd hostlr
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Environment Setup

**Server** — Create `server/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hostlr
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

**Client** (optional) — Create `client/.env` if API is elsewhere:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 3. Seed Admin User

```bash
cd server
npm run seed:admin
```

Default admin: `admin@hostlr.com` / `admin123` (change in production)

### 4. Run Development

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/v1

### 5. Production Build

```bash
cd client
npm run build
```

Serve `client/dist` with your preferred static host. Point API base URL via `VITE_API_URL` at build time.

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Register (warden/student) |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Get current user |
| PATCH | `/auth/me` | Update profile |
| GET | `/users` | List users (admin) |
| GET | `/hostels` | List hostels |
| GET | `/rooms` | List rooms |
| GET | `/allotments` | List allotments |
| GET | `/fees` | List fees |
| GET | `/complaints` | List complaints |
| GET | `/leaves` | List leave requests |
| POST | `/leaves` | Create leave (student) |
| PATCH | `/leaves/:id/approve` | Approve leave (admin/warden) |
| PATCH | `/leaves/:id/reject` | Reject leave (admin/warden) |
| GET | `/visitors` | List visitor logs |
| POST | `/visitors` | Log visitor |
| PATCH | `/visitors/:id/checkout` | Check out visitor (admin/warden) |
| GET | `/announcements` | List announcements |
| GET | `/stats` | Analytics (admin/warden/accountant) |
| POST | `/upload` | Upload image |

## Routes (Frontend)

| Path | Roles |
|------|-------|
| `/admin/*` | Admin |
| `/warden/*` | Warden, Accountant |
| `/student/*` | Student |
| `/login` | Public |
| `/register` | Public |

## License

MIT
