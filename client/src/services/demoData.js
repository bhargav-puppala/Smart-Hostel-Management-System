const now = () => new Date().toISOString();

const adminUser = {
  _id: 'demo-admin',
  uid: 'demo-admin',
  name: 'Admin',
  email: 'admin@demo.com',
  role: 'admin',
  approvalStatus: 'approved',
  avatarUrl: '',
  createdAt: now(),
  updatedAt: now(),
};

const studentUser = {
  _id: 'demo-student',
  uid: 'demo-student',
  name: 'Bhargav',
  email: 'bhargav@demo.com',
  role: 'student',
  approvalStatus: 'approved',
  avatarUrl: '',
  createdAt: now(),
  updatedAt: now(),
};

const wardenUser = {
  _id: 'demo-warden',
  uid: 'demo-warden',
  name: 'Demo Warden',
  email: 'warden@demo.com',
  role: 'warden',
  approvalStatus: 'approved',
  avatarUrl: '',
  createdAt: now(),
  updatedAt: now(),
};

const accountantUser = {
  _id: 'demo-accountant',
  uid: 'demo-accountant',
  name: 'Demo Accountant',
  email: 'accountant@demo.com',
  role: 'accountant',
  approvalStatus: 'approved',
  avatarUrl: '',
  createdAt: now(),
  updatedAt: now(),
};

const hostels = [
  {
    _id: 'hostel-la1',
    name: 'Lalitha Aditya 1',
    address: 'Lalitha Aditya Hostels',
    totalRooms: 3,
    imageUrl: '',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    _id: 'hostel-la2',
    name: 'Lalitha Aditya 2',
    address: 'Lalitha Aditya Hostels',
    totalRooms: 3,
    imageUrl: '',
    createdAt: now(),
    updatedAt: now(),
  },
];

const rooms = [
  { _id: 'room-101', roomNumber: '101', hostelId: 'hostel-la1', capacity: 3, status: 'available', createdAt: now(), updatedAt: now() },
  { _id: 'room-102', roomNumber: '102', hostelId: 'hostel-la1', capacity: 3, status: 'available', createdAt: now(), updatedAt: now() },
  { _id: 'room-201', roomNumber: '201', hostelId: 'hostel-la1', capacity: 3, status: 'available', createdAt: now(), updatedAt: now() },
  { _id: 'room-301', roomNumber: '301', hostelId: 'hostel-la2', capacity: 3, status: 'available', createdAt: now(), updatedAt: now() },
  { _id: 'room-302', roomNumber: '302', hostelId: 'hostel-la2', capacity: 3, status: 'available', createdAt: now(), updatedAt: now() },
  { _id: 'room-303', roomNumber: '303', hostelId: 'hostel-la2', capacity: 3, status: 'available', createdAt: now(), updatedAt: now() },
];

const beds = rooms.flatMap((room) =>
  [1, 2, 3].map((bedNumber) => ({
    _id: `bed-${room.roomNumber}-${bedNumber}`,
    roomId: room._id,
    bedNumber,
  }))
);

const occupiedStudentSeeds = [
  { _id: 'student-bhargav', name: 'Bhargav', email: 'bhargav@demo.com' },
  { _id: 'student-jagadeesh', name: 'Jagadeesh', email: 'jagadeesh@demo.com' },
  { _id: 'student-lokesh', name: 'Lokesh', email: 'lokesh@demo.com' },
  { _id: 'student-rajesh', name: 'Rajesh', email: 'rajesh@demo.com' },
  { _id: 'student-diwakar', name: 'Diwakar', email: 'diwakar@demo.com' },
  { _id: 'student-ravi', name: 'Ravi Kumar', email: 'ravi@demo.com' },
  { _id: 'student-arun', name: 'Arun Kumar', email: 'arun@demo.com' },
  { _id: 'student-manoj', name: 'Manoj Reddy', email: 'manoj@demo.com' },
  { _id: 'student-kiran', name: 'Kiran Teja', email: 'kiran@demo.com' },
  { _id: 'student-suresh', name: 'Suresh Babu', email: 'suresh@demo.com' },
  { _id: 'student-naresh', name: 'Naresh', email: 'naresh@demo.com' },
  { _id: 'student-varun', name: 'Varun', email: 'varun@demo.com' },
  { _id: 'student-praveen', name: 'Praveen', email: 'praveen@demo.com' },
  { _id: 'student-sai', name: 'Sai Kiran', email: 'saikiran@demo.com' },
  { _id: 'student-vamshi', name: 'Vamshi Krishna', email: 'vamshi@demo.com' },
];

const occupiedStudents = occupiedStudentSeeds.map((student) => ({
  _id: student._id,
  uid: student._id,
  name: student.name,
  email: student.email,
  role: 'student',
  approvalStatus: 'approved',
  avatarUrl: '',
  createdAt: now(),
  updatedAt: now(),
}));

const users = [
  adminUser,
  studentUser,
  wardenUser,
  accountantUser,
  ...occupiedStudents,
  {
    _id: 'demo-user-pending-warden',
    uid: 'demo-user-pending-warden',
    name: 'Pending Warden',
    email: 'pending-warden@demo.com',
    role: 'warden',
    approvalStatus: 'pending',
    avatarUrl: '',
    createdAt: now(),
    updatedAt: now(),
  },
];

// Target occupancy: 15 occupied / 18 total (3 vacant).
const occupiedBedsByRoom = {
  'room-101': [1, 2, 3],
  'room-102': [1, 2, 3],
  'room-201': [1, 2],
  'room-301': [1, 2, 3],
  'room-302': [1, 2],
  'room-303': [1, 2],
};

const occupiedAssignments = Object.entries(occupiedBedsByRoom).flatMap(([roomId, bedNumbers]) =>
  bedNumbers.map((bedNumber) => ({ roomId, bedNumber }))
);

const allotments = occupiedAssignments.map((assignment, index) => ({
  _id: `allotment-${index + 1}`,
  studentId: occupiedStudents[index]._id,
  roomId: assignment.roomId,
  bedNumber: assignment.bedNumber,
  startDate: now(),
  endDate: null,
  createdAt: now(),
  updatedAt: now(),
}));

const bookings = occupiedAssignments.map((assignment, index) => ({
  _id: `booking-occupied-${index + 1}`,
  studentId: occupiedStudents[index]._id,
  roomId: assignment.roomId,
  bedNumber: assignment.bedNumber,
  details: 'Confirmed allotment in high occupancy demo setup',
  amount: 5500,
  status: 'occupied',
  paymentStatus: 'paid',
  createdAt: now(),
  updatedAt: now(),
}));

const payments = bookings.map((booking, index) => ({
  _id: `payment-${index + 1}`,
  bookingId: booking._id,
  studentId: booking.studentId,
  roomId: booking.roomId,
  bedNumber: booking.bedNumber,
  amount: booking.amount,
  status: 'paid',
  method: 'upi',
  transactionRef: `DEMO-UPI-${String(index + 1).padStart(3, '0')}`,
  proofUrl: '',
  paidAt: now(),
  createdAt: now(),
  updatedAt: now(),
}));

const fees = [
  {
    _id: 'fee-1',
    studentId: 'demo-student',
    amount: 4500,
    dueDate: now(),
    status: 'pending',
    description: 'Hostel fee for current month',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    _id: 'fee-2',
    studentId: 'student-bhargav',
    amount: 5500,
    dueDate: now(),
    status: 'paid',
    description: 'Hostel fee settled',
    createdAt: now(),
    updatedAt: now(),
  },
];

const complaints = [
  {
    _id: 'complaint-1',
    studentId: 'demo-student',
    title: 'Wi-Fi is unstable',
    description: 'Frequent disconnects near room 201',
    imageUrls: [],
    status: 'open',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    _id: 'complaint-2',
    studentId: 'student-rajesh',
    title: 'Fan maintenance needed',
    description: 'Ceiling fan making noise in room 302',
    imageUrls: [],
    status: 'resolved',
    createdAt: now(),
    updatedAt: now(),
  },
];

const leaves = [
  {
    _id: 'leave-1',
    studentId: 'demo-student',
    reason: 'Family event',
    fromDate: now(),
    toDate: now(),
    status: 'pending',
    createdAt: now(),
    updatedAt: now(),
  },
];

const visitors = [
  {
    _id: 'visitor-1',
    studentId: 'student-bhargav',
    visitorName: 'Rahul Verma',
    visitorPhone: '9999999999',
    relation: 'Brother',
    purpose: 'Visit',
    checkInAt: now(),
    checkOutAt: null,
    createdAt: now(),
    updatedAt: now(),
  },
];

const announcements = [
  {
    _id: 'announcement-1',
    title: 'High Occupancy Notice',
    content: 'Lalitha Aditya Hostels is at high occupancy. Limited beds are available for new bookings.',
    createdBy: 'demo-admin',
    hostelId: null,
    isPinned: true,
    createdAt: now(),
    updatedAt: now(),
  },
];

export const createDemoStore = () => ({
  users: [...users],
  hostels: [...hostels],
  rooms: [...rooms],
  beds: [...beds],
  bookings: [...bookings],
  payments: [...payments],
  allotments: [...allotments],
  fees: [...fees],
  complaints: [...complaints],
  leaves: [...leaves],
  visitors: [...visitors],
  announcements: [...announcements],
});
