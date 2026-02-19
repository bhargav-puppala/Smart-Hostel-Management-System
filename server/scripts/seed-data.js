require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/modules/users/user.model');
const Hostel = require('../src/modules/hostels/hostel.model');
const Room = require('../src/modules/rooms/room.model');
const Allotment = require('../src/modules/allotments/allotment.model');
const Fee = require('../src/modules/fees/fee.model');
const Complaint = require('../src/modules/complaints/complaint.model');
const Announcement = require('../src/modules/announcements/announcement.model');
const Leave = require('../src/modules/leaves/leave.model');
const Visitor = require('../src/modules/visitors/visitor.model');
const {
  ROLES,
  ROOM_STATUS,
  FEE_STATUS,
  COMPLAINT_STATUS,
  LEAVE_STATUS,
} = require('../src/shared/constants');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hostlr';

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Ensure admin exists
    let admin = await User.findOne({ email: 'admin@hostlr.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Admin',
        email: 'admin@hostlr.com',
        password: 'admin123',
        role: ROLES.ADMIN,
      });
      console.log('Created admin: admin@hostlr.com / admin123');
    } else {
      console.log('Admin already exists');
    }

    // 2. Create hostels
    const hostels = await Hostel.find({});
    let hostelA, hostelB;
    if (hostels.length === 0) {
      [hostelA, hostelB] = await Hostel.insertMany([
        { name: 'Boys Hostel A', address: 'Campus North, Block A', totalRooms: 50 },
        { name: 'Girls Hostel B', address: 'Campus South, Block B', totalRooms: 40 },
      ]);
      console.log('Created 2 hostels');
    } else {
      hostelA = hostels[0];
      hostelB = hostels[1] || hostels[0];
    }

    // 3. Create rooms
    const existingRooms = await Room.countDocuments();
    let roomsA = [], roomsB = [];
    if (existingRooms === 0) {
      const roomDocsA = Array.from({ length: 10 }, (_, i) => ({
        hostelId: hostelA._id,
        roomNumber: `A-${101 + i}`,
        capacity: 2,
        occupants: [],
        status: ROOM_STATUS.AVAILABLE,
      }));
      const roomDocsB = Array.from({ length: 8 }, (_, i) => ({
        hostelId: hostelB._id,
        roomNumber: `B-${201 + i}`,
        capacity: 2,
        occupants: [],
        status: ROOM_STATUS.AVAILABLE,
      }));
      roomsA = await Room.insertMany(roomDocsA);
      roomsB = await Room.insertMany(roomDocsB);
      // One room in maintenance
      await Room.findByIdAndUpdate(roomsA[9]._id, { status: ROOM_STATUS.MAINTENANCE });
      console.log('Created 18 rooms (1 in maintenance)');
    } else {
      roomsA = await Room.find({ hostelId: hostelA._id }).limit(10);
      roomsB = await Room.find({ hostelId: hostelB._id }).limit(8);
    }

    // 4. Create users (wardens, accountant, students)
    const existingUsers = await User.countDocuments({ role: { $ne: ROLES.ADMIN } });
    let wardens = [], accountant, students = [];
    if (existingUsers < 5) {
      const wardenDocs = [
        { name: 'Warden John', email: 'warden@hostlr.com', password: 'warden123', role: ROLES.WARDEN, hostelId: hostelA._id, approvalStatus: 'approved' },
        { name: 'Warden Jane', email: 'warden2@hostlr.com', password: 'warden123', role: ROLES.WARDEN, hostelId: hostelB._id, approvalStatus: 'approved' },
      ];
      wardens = await User.insertMany(wardenDocs);

      accountant = await User.create({
        name: 'Accountant Mike',
        email: 'accountant@hostlr.com',
        password: 'accountant123',
        role: ROLES.ACCOUNTANT,
        approvalStatus: 'approved',
      });

      const studentDocs = [
        { name: 'Student Alex', email: 'alex@hostlr.com', password: 'student123', role: ROLES.STUDENT },
        { name: 'Student Sam', email: 'sam@hostlr.com', password: 'student123', role: ROLES.STUDENT },
        { name: 'Student Riley', email: 'riley@hostlr.com', password: 'student123', role: ROLES.STUDENT },
        { name: 'Student Jordan', email: 'jordan@hostlr.com', password: 'student123', role: ROLES.STUDENT },
        { name: 'Student Casey', email: 'casey@hostlr.com', password: 'student123', role: ROLES.STUDENT },
        { name: 'Student Morgan', email: 'morgan@hostlr.com', password: 'student123', role: ROLES.STUDENT },
      ];
      students = await User.insertMany(studentDocs);
      console.log('Created wardens, accountant, and 6 students');
    } else {
      wardens = await User.find({ role: ROLES.WARDEN }).limit(2);
      accountant = await User.findOne({ role: ROLES.ACCOUNTANT });
      students = await User.find({ role: ROLES.STUDENT }).limit(6);
    }

    // 5. Create allotments
    const existingAllotments = await Allotment.countDocuments();
    if (existingAllotments === 0 && students.length >= 4 && roomsA.length >= 4) {
      const allots = [];
      for (let i = 0; i < Math.min(4, students.length); i++) {
        const room = roomsA[i];
        const student = students[i];
        allots.push({
          studentId: student._id,
          roomId: room._id,
          startDate: addDays(new Date(), -60),
        });
      }
      await Allotment.insertMany(allots);
      // Update room occupants and user hostelId
      for (let i = 0; i < allots.length; i++) {
        const room = await Room.findById(roomsA[i]._id);
        room.occupants.push(students[i]._id);
        await room.save();
        await User.findByIdAndUpdate(students[i]._id, { hostelId: hostelA._id });
      }
      console.log('Created 4 allotments');
    }

    // 6. Create fees
    const existingFees = await Fee.countDocuments();
    if (existingFees === 0 && students.length >= 4) {
      const now = new Date();
      await Fee.insertMany([
        { studentId: students[0]._id, amount: 5000, dueDate: addDays(now, -10), status: FEE_STATUS.OVERDUE, description: 'Monthly hostel fee' },
        { studentId: students[0]._id, amount: 5000, dueDate: addDays(now, 20), status: FEE_STATUS.PENDING, description: 'Monthly hostel fee' },
        { studentId: students[1]._id, amount: 5000, dueDate: addDays(now, -5), status: FEE_STATUS.PAID, paidDate: addDays(now, -6), description: 'Monthly hostel fee' },
        { studentId: students[2]._id, amount: 5000, dueDate: addDays(now, 15), status: FEE_STATUS.PENDING, description: 'Monthly hostel fee' },
        { studentId: students[3]._id, amount: 5000, dueDate: addDays(now, 25), status: FEE_STATUS.PENDING, description: 'Monthly hostel fee' },
      ]);
      console.log('Created 5 fees (mix of pending, paid, overdue)');
    }

    // 7. Create complaints
    const existingComplaints = await Complaint.countDocuments();
    if (existingComplaints === 0 && students.length >= 3) {
      await Complaint.insertMany([
        { studentId: students[0]._id, title: 'Water leakage', description: 'Water leaking from ceiling in bathroom', status: COMPLAINT_STATUS.OPEN },
        { studentId: students[1]._id, title: 'Broken window', description: 'Window pane cracked in room', status: COMPLAINT_STATUS.IN_PROGRESS },
        { studentId: students[2]._id, title: 'WiFi issue', description: 'No internet in room for 2 days', status: COMPLAINT_STATUS.RESOLVED, resolvedBy: admin._id, resolvedAt: new Date(), resolutionNotes: 'Router reset done' },
      ]);
      console.log('Created 3 complaints');
    }

    // 8. Create announcements
    const existingAnnouncements = await Announcement.countDocuments();
    if (existingAnnouncements === 0) {
      await Announcement.insertMany([
        { title: 'Hostel Rules', content: 'Quiet hours: 10 PM - 6 AM. No visitors after 8 PM.', createdBy: admin._id, isPinned: true },
        { title: 'Fee Due Reminder', content: 'Monthly fees due by 5th of each month. Late fees apply after 10th.', createdBy: admin._id, hostelId: hostelA._id },
        { title: 'Maintenance Notice', content: 'Water supply will be off on Sunday 6 AM - 12 PM for pipeline maintenance.', createdBy: wardens[0]?._id || admin._id, hostelId: hostelA._id },
      ]);
      console.log('Created 3 announcements');
    }

    // 9. Create leaves
    const existingLeaves = await Leave.countDocuments();
    if (existingLeaves === 0 && students.length >= 3) {
      await Leave.insertMany([
        { studentId: students[0]._id, reason: 'Family visit', fromDate: addDays(new Date(), 2), toDate: addDays(new Date(), 5), status: LEAVE_STATUS.PENDING },
        { studentId: students[1]._id, reason: 'Medical emergency', fromDate: addDays(new Date(), -3), toDate: addDays(new Date(), -1), status: LEAVE_STATUS.APPROVED, approvedBy: admin._id, approvedAt: new Date(), outpassCode: 'OUT-2024-001' },
        { studentId: students[2]._id, reason: 'Personal', fromDate: addDays(new Date(), -10), toDate: addDays(new Date(), -8), status: LEAVE_STATUS.REJECTED, approvedBy: admin._id, approvedAt: new Date(), rejectionReason: 'Insufficient documentation' },
      ]);
      console.log('Created 3 leave requests');
    }

    // 10. Create visitors
    const existingVisitors = await Visitor.countDocuments();
    if (existingVisitors === 0 && students.length >= 2) {
      const now = new Date();
      await Visitor.insertMany([
        { studentId: students[0]._id, visitorName: 'John Doe', visitorPhone: '9876543210', relation: 'Parent', purpose: 'Visit', checkInAt: addDays(now, -10), checkOutAt: addDays(now, -10), loggedBy: wardens[0]?._id || admin._id },
        { studentId: students[0]._id, visitorName: 'Jane Smith', visitorPhone: '9876543211', relation: 'Sibling', purpose: 'Visit', checkInAt: addDays(now, -2), loggedBy: wardens[0]?._id || admin._id },
        { studentId: students[1]._id, visitorName: 'Robert Brown', visitorPhone: '9876543212', relation: 'Guardian', purpose: 'Fee collection', checkInAt: addDays(now, -5), checkOutAt: addDays(now, -5), loggedBy: admin._id },
      ]);
      console.log('Created 3 visitor logs');
    }

    console.log('\nSeed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('  Admin: admin@hostlr.com / admin123');
    console.log('  Warden: warden@hostlr.com / warden123');
    console.log('  Accountant: accountant@hostlr.com / accountant123');
    console.log('  Student: alex@hostlr.com / student123');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
