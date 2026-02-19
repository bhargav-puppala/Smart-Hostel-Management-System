# Hostlr — How Everything Works (Simple Guide)

This document explains how each feature in Hostlr works, in plain language.

---

## 1. Who Can Use the App?

There are four types of users:

| Role | Who they are | What they can do |
|------|--------------|------------------|
| **Admin** | Person in charge of the whole system | Everything: manage hostels, rooms, users, fees, complaints, announcements, reports |
| **Warden** | Person in charge of a hostel | Manage hostels, rooms, allotments, fees, complaints, announcements for their hostel |
| **Accountant** | Person who handles money | Create fees, mark fees as paid |
| **Student** | Person who lives in the hostel | View and manage their own fees, complaints, leave requests, visitors, and notices |

---

## 2. Sign Up & Login

**Flow:**
1. You go to the website and click **Register**.
2. You enter your name, email, password, and choose if you are a **Warden** or **Student**.
3. If you register as a **Warden**, the Admin must approve your account before you can log in.
4. If you register as a **Student**, you can log in right away.
5. After approval (or immediately for students), you log in with your email and password.

---

## 3. Hostels

**What it is:** A hostel is a building where students live.

**Flow:**
1. Admin creates a hostel (name, address, total number of rooms).
2. Admin can add a photo of the hostel.
3. Wardens and students can see the list of hostels.
4. Admin can edit or delete hostels.

---

## 4. Rooms

**What it is:** Rooms are inside hostels. Each room has a number and a capacity (how many students can stay).

**Flow:**
1. Admin or Warden creates rooms inside a hostel (room number, capacity).
2. Each room has a status:
   - **Available** — Has empty beds
   - **Full** — No empty beds
   - **Maintenance** — Under repair, not usable
3. The system updates status automatically when students are allotted or removed.

---

## 5. Allotments (Assigning Students to Rooms)

**What it is:** Allotment means giving a student a bed in a room.

**Flow:**
1. Admin or Warden selects a student and a room.
2. The room must be available and have empty beds.
3. The student is assigned to that room.
4. The student’s hostel is updated in their profile.
5. When the student leaves, Admin or Warden can end the allotment.

---

## 6. Fees

**What it is:** Money students pay for hostel stay (monthly or other charges).

**Flow:**
1. Admin or Accountant creates a fee for a student (amount, due date, description).
2. The fee can be:
   - **Pending** — Not yet paid
   - **Paid** — Paid on time
   - **Overdue** — Due date passed but not paid
3. Admin or Accountant marks the fee as paid when the student pays.
4. Students can see their own fees.

---

## 7. Complaints

**What it is:** Complaints are issues students report (e.g., broken window, water leakage).

**Flow:**
1. Student submits a complaint (title, description, optional photo).
2. The complaint goes to Admin or Warden.
3. Status can be:
   - **Open** — Just received
   - **In Progress** — Someone is working on it
   - **Resolved** — Fixed
   - **Closed** — Done and closed
4. Admin or Warden marks it resolved and can add notes.

---

## 8. Announcements

**What it is:** Notices or messages posted by Admin or Warden for everyone.

**Flow:**
1. Admin or Warden creates an announcement (title, content).
2. It can be:
   - **Pinned** — Stays at the top
   - **Hostel-specific** — Only for one hostel, or for all
3. Students see announcements on their dashboard.

---

## 9. Leave / Outpass

**What it is:** When a student wants to leave the hostel for a few days, they request leave. If approved, they get an **outpass code** to show at the gate.

**Flow:**
1. Student submits a leave request (reason, from date, to date).
2. Admin or Warden reviews it.
3. If **approved**:
   - A unique outpass code is generated (e.g., OP-ABC123).
   - Student can use this code when leaving and returning.
4. If **rejected**:
   - Admin or Warden can add a reason (e.g., “Insufficient documents”).

---

## 10. Visitor Log

**What it is:** A record of who visits which student and when.

**Flow:**
1. When a visitor arrives, Admin, Warden, or Student logs them in:
   - Visitor name, phone, relation (e.g., parent), purpose
   - Check-in time is recorded
2. When the visitor leaves, Admin or Warden checks them out.
   - Check-out time is recorded
3. Anyone can see who visited whom and when.

---

## 11. Reports (Analytics)

**What it is:** A summary of hostel data for decision-making.

**Flow:**
1. Admin, Warden, or Accountant opens the Reports page.
2. They see:
   - Number of hostels, rooms, students
   - Occupancy (how many beds are full)
   - Revenue (fees collected)
   - Fee status (pending, paid, overdue)
   - Complaints (open, resolved, etc.)

---

## 12. Settings

**What it is:** Where users update their profile.

**Flow:**
1. Any logged-in user can go to Settings.
2. They can change:
   - Name
   - Profile photo (avatar)
   - Password

---

## 13. Dark Mode

**What it is:** A dark theme for the screen so it’s easier on the eyes at night.

**Flow:**
1. Click the sun/moon icon in the header.
2. The app switches between light and dark mode.
3. Your choice is saved automatically.

---

## Quick Reference: Who Does What

| Action | Admin | Warden | Accountant | Student |
|--------|-------|--------|------------|---------|
| Create hostel | ✅ | ❌ | ❌ | ❌ |
| Create room | ✅ | ✅ | ❌ | ❌ |
| Allot room | ✅ | ✅ | ❌ | ❌ |
| Create fee | ✅ | ❌ | ✅ | ❌ |
| Mark fee paid | ✅ | ❌ | ✅ | ❌ |
| Resolve complaint | ✅ | ✅ | ❌ | ❌ |
| Create announcement | ✅ | ✅ | ❌ | ❌ |
| Approve/Reject leave | ✅ | ✅ | ❌ | ❌ |
| Log visitor | ✅ | ✅ | ❌ | ✅ |
| Check out visitor | ✅ | ✅ | ❌ | ❌ |
| View reports | ✅ | ✅ | ✅ | ❌ |
| Request leave | ❌ | ❌ | ❌ | ✅ |
| Submit complaint | ❌ | ❌ | ❌ | ✅ |
| View own fees | ❌ | ❌ | ❌ | ✅ |
