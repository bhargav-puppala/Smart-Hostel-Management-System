# HOSTLR

Smart Hostel Management System built with React, with dual runtime modes:

- Demo Mode (default): no Firebase setup required, uses in-memory mock auth + mock data.
- Production Mode: Firebase Auth + Firestore.

## What Was Rebuilt

- Removed the old Node/Mongo/JWT backend and database logic.
- Moved authentication to Firebase Authentication.
- Moved data persistence to Firestore.
- Implemented booking lifecycle with state transitions:
   1. Student requests room + bed.
   2. Admin/Warden approves or rejects request.
   3. Student/Admin records payment.
   4. Booking becomes occupied and creates active allotment.
- Added bed-level availability checks to prevent double booking.

## Stack

- React 19 + Vite + Tailwind CSS
- Firebase Authentication (email/password)
- Firestore (all application data)

## Project Structure

```
hostlr/
   client/
      src/
         components/
         context/
         firebase/
         pages/
         services/
   flow.md
   README.md
```

## Runtime Modes

### Demo Mode (default)

- Works fully without Firebase config.
- Uses seeded demo data and mock authentication.
- Supports end-to-end demo flow: Book -> Approve -> Pay -> Occupied, plus Complaint actions.
- Optional role switching between Student/Admin is available from the user menu.

### Production Mode (Firebase)

Set `VITE_DEMO_MODE=false` and provide Firebase variables.

## Required Firebase Setup (Production Mode)

1. Create a Firebase project.
2. Enable Authentication > Sign-in method > Email/Password.
3. Create Firestore database in production or test mode.
4. Copy Web App config values into `client/.env`.

### Environment Variables

Create `client/.env` with:

```env
VITE_DEMO_MODE=true

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

To run production mode instead of demo mode:

```env
VITE_DEMO_MODE=false
```

## Install and Run

```bash
cd hostlr/client
npm install
npm run dev
```

App URL: `http://localhost:5173`

Demo login shortcuts:

- Student: `bhargav@demo.com`
- Admin: `admin@demo.com`
- Any password works in demo mode.

Production build:

```bash
npm run build
```

## Deploy on Vercel

This project uses a nested frontend at `hostlr/client` and React Router routes.

Use one of these approaches:

1. Deploy `hostlr` root (recommended with this repo):
   1. Keep `hostlr/vercel.json` in place.
   2. Vercel will run install/build inside `client` and serve `client/dist`.
2. Deploy `hostlr/client` as Root Directory:
   1. Set Vercel project Root Directory to `client`.
   2. Add SPA fallback rewrite in Vercel settings (or keep equivalent `vercel.json`).

Why this matters: without SPA fallback, direct visits to URLs like `/student/bookings` return `NOT_FOUND` because Vercel looks for a real file at that path.

## First Admin Bootstrap

Because this is frontend-only Firebase, first admin setup is manual once:

1. Create a user in Firebase Auth (email/password) from Firebase Console.
2. In Firestore, create document in `users` collection with document id = that Auth UID.
3. Set fields:

```json
{
   "name": "Admin",
   "email": "your-admin-email",
   "role": "admin",
   "approvalStatus": "approved",
   "avatarUrl": "",
   "createdAt": "2026-01-01T00:00:00.000Z",
   "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

After this, admin can approve wardens and manage users from UI.

## Firestore Collections

Main collections used:

- `users`
- `hostels`
- `rooms`
- `bookings`
- `payments`
- `allotments`
- `fees`
- `complaints`
- `leaves`
- `visitors`
- `announcements`

## Core Workflow Rules Implemented

- Students cannot create duplicate active bookings.
- Bed can be requested only if currently available.
- Approval moves booking to `approved`.
- Payment moves booking to `occupied` and `paymentStatus=paid`.
- Payment creation also creates allotment if student has no active allotment.
- Room bed states are derived from active bookings and allotments.

## Security Notes

- No hardcoded credentials are included.
- No seeded default admin password is shipped.
- All environment secrets are externalized via `client/.env`.

## Suggested Firestore Rules (Starter)

Use role-based claims/doc checks in production. Example starter rules:

```txt
rules_version = '2';
service cloud.firestore {
   match /databases/{database}/documents {
      match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
      }

      match /{document=**} {
         allow read, write: if request.auth != null;
      }
   }
}
```

Tighten these before production by enforcing role checks per collection.
