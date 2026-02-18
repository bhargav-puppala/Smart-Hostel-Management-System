# Hostlr Backend API

Hostel Management System - Production-ready MERN backend with layered architecture.

## Architecture

- **Layered**: Controllers → Services → Repositories → Models
- **RBAC**: Admin, Warden, Accountant, Student
- **Versioned API**: `/api/v1/...`

## Setup

1. Copy `.env.example` to `.env` and configure
2. Ensure MongoDB is running
3. `npm install`
4. `npm run seed:admin` (creates admin@hostlr.com / admin123)
5. `npm run dev`

## API Endpoints

| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| POST | /api/v1/auth/register | No | - |
| POST | /api/v1/auth/login | No | - |
| GET | /api/v1/auth/me | Yes | All |
| GET | /api/v1/users | Yes | Admin, Warden |
| GET | /api/v1/hostels | Yes | Admin, Warden |
| GET | /api/v1/rooms | Yes | Admin, Warden, Student |
| GET | /api/v1/allotments | Yes | Admin, Warden |
| GET | /api/v1/fees | Yes | All |
| GET | /api/v1/complaints | Yes | All |

## Scripts

- `npm start` - Production
- `npm run dev` - Development with nodemon
- `npm run seed:admin` - Create admin user
