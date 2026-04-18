import { createDemoStore } from './demoData';

let store = createDemoStore();

const nowIso = () => new Date().toISOString();

const makeId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const wrap = (data, pagination) => ({ data: { success: true, data, pagination } });

const demoError = (message, status = 400) => {
  const error = new Error(message);
  error.response = { data: { message }, status };
  return error;
};

const paginate = (items, params = {}) => {
  const page = Math.max(1, Number(params.page || 1));
  const limit = Math.max(1, Number(params.limit || items.length || 1));
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / limit)),
    },
  };
};

const readDemoRole = () => localStorage.getItem('demoRole') || 'student';

const pickDemoUser = (roleOverride) => {
  const role = roleOverride || readDemoRole();
  if (role === 'admin') return store.users.find((u) => u._id === 'demo-admin');
  return store.users.find((u) => u._id === 'demo-student');
};

const getCurrentUser = () => {
  const selectedRole = readDemoRole();
  const user = pickDemoUser(selectedRole);
  if (!user) throw demoError('Demo user not found', 500);
  return user;
};

const getHostel = (hostelId) => store.hostels.find((h) => h._id === hostelId) || null;

const getUserById = (userId) => store.users.find((u) => u._id === userId) || null;

const activeAllotments = () => store.allotments.filter((a) => !a.endDate);

const activeBookings = () => store.bookings.filter((b) => ['pending', 'approved', 'occupied'].includes(b.status));

const enrichRoom = (room) => {
  const capacity = Number(room.capacity || 0);
  const bedNumbers = Array.from({ length: capacity }, (_, idx) => idx + 1);

  const roomAllotments = activeAllotments().filter((a) => a.roomId === room._id);
  const roomBookings = activeBookings().filter((b) => b.roomId === room._id);

  const occupied = new Set([
    ...roomAllotments.map((a) => Number(a.bedNumber)),
    ...roomBookings.filter((b) => b.status === 'occupied').map((b) => Number(b.bedNumber)),
  ]);

  const reserved = new Set(
    roomBookings
      .filter((b) => ['pending', 'approved'].includes(b.status))
      .map((b) => Number(b.bedNumber))
  );

  const beds = bedNumbers.map((bedNumber) => {
    if (occupied.has(bedNumber)) return { bedNumber, status: 'occupied' };
    if (reserved.has(bedNumber)) return { bedNumber, status: 'reserved' };
    return { bedNumber, status: 'available' };
  });

  const availableBeds = beds.filter((b) => b.status === 'available').map((b) => b.bedNumber);
  const occupiedBeds = beds.filter((b) => b.status === 'occupied').map((b) => b.bedNumber);
  const reservedBeds = beds.filter((b) => b.status === 'reserved').map((b) => b.bedNumber);

  return {
    ...room,
    hostelId: getHostel(room.hostelId),
    beds,
    availableBeds,
    occupiedBeds,
    reservedBeds,
    occupants: occupiedBeds,
    status: room.status === 'maintenance' ? 'maintenance' : availableBeds.length > 0 ? 'available' : 'full',
  };
};

const enrichBooking = (booking) => ({
  ...booking,
  studentId: getUserById(booking.studentId),
  roomId: enrichRoom(store.rooms.find((r) => r._id === booking.roomId)),
});

const enrichPayment = (payment) => ({
  ...payment,
  studentId: getUserById(payment.studentId),
  roomId: enrichRoom(store.rooms.find((r) => r._id === payment.roomId)),
});

const enrichAllotment = (allotment) => ({
  ...allotment,
  studentId: getUserById(allotment.studentId),
  roomId: enrichRoom(store.rooms.find((r) => r._id === allotment.roomId)),
});

const filterItems = (items, params = {}) => {
  const ignored = new Set(['page', 'limit']);
  return items.filter((item) => {
    for (const [key, value] of Object.entries(params)) {
      if (ignored.has(key) || value === undefined || value === null || value === '') continue;
      if (key === 'checkedOut') {
        const expected = String(value) === 'true';
        if (Boolean(item.checkOutAt) !== expected) return false;
        continue;
      }
      if (String(item[key]) !== String(value)) return false;
    }
    return true;
  });
};

export const demoModeApi = {
  isDemoMode: true,
};

export const authApi = {
  login: async ({ email }) => {
    const role = email === 'admin@demo.com' ? 'admin' : email === 'bhargav@demo.com' ? 'student' : readDemoRole();
    localStorage.setItem('demoRole', role);
    const user = pickDemoUser(role);
    if (!user) throw demoError('Invalid demo user', 401);
    return wrap({ user, accessToken: 'demo-session-token' });
  },

  register: async ({ name, email, role = 'student' }) => {
    const id = makeId('demo-user');
    const approvalStatus = role === 'warden' ? 'pending' : 'approved';
    const user = {
      _id: id,
      uid: id,
      name,
      email,
      role,
      approvalStatus,
      avatarUrl: '',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.users.unshift(user);
    return wrap({
      user,
      accessToken: 'demo-session-token',
      requiresApproval: role === 'warden',
      message: role === 'warden' ? 'Registration successful. Your account is pending admin approval.' : 'Registration successful',
    });
  },

  me: async () => wrap(getCurrentUser()),

  updateProfile: async (data) => {
    const current = getCurrentUser();
    const next = {
      ...current,
      name: data.name ?? current.name,
      avatarUrl: data.avatarUrl ?? current.avatarUrl,
      updatedAt: nowIso(),
    };
    store.users = store.users.map((u) => (u._id === current._id ? next : u));
    return wrap(next);
  },

  refreshToken: async () => wrap({ accessToken: 'demo-session-token' }),
};

export const hostelsApi = {
  getAll: async (params = {}) => {
    const { data, pagination } = paginate(filterItems(store.hostels, params), params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const hostel = store.hostels.find((h) => h._id === id);
    if (!hostel) throw demoError('Hostel not found', 404);
    return wrap(hostel);
  },
  create: async (payload) => {
    const hostel = { _id: makeId('hostel'), ...payload, createdAt: nowIso(), updatedAt: nowIso() };
    store.hostels.unshift(hostel);
    return wrap(hostel);
  },
  update: async (id, payload) => {
    const existing = store.hostels.find((h) => h._id === id);
    if (!existing) throw demoError('Hostel not found', 404);
    const next = { ...existing, ...payload, updatedAt: nowIso() };
    store.hostels = store.hostels.map((h) => (h._id === id ? next : h));
    return wrap(next);
  },
  delete: async (id) => {
    store.hostels = store.hostels.filter((h) => h._id !== id);
    return wrap({ deleted: true });
  },
};

export const roomsApi = {
  getAll: async (params = {}) => {
    const filtered = filterItems(store.rooms, params).map(enrichRoom);
    const { data, pagination } = paginate(filtered, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const room = store.rooms.find((r) => r._id === id);
    if (!room) throw demoError('Room not found', 404);
    return wrap(enrichRoom(room));
  },
  create: async (payload) => {
    const room = {
      _id: makeId('room'),
      ...payload,
      capacity: Number(payload.capacity || 1),
      status: payload.status || 'available',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.rooms.unshift(room);
    return wrap(enrichRoom(room));
  },
  update: async (id, payload) => {
    const room = store.rooms.find((r) => r._id === id);
    if (!room) throw demoError('Room not found', 404);
    const next = { ...room, ...payload, updatedAt: nowIso() };
    store.rooms = store.rooms.map((r) => (r._id === id ? next : r));
    return wrap(enrichRoom(next));
  },
  delete: async (id) => {
    store.rooms = store.rooms.filter((r) => r._id !== id);
    return wrap({ deleted: true });
  },
};

export const usersApi = {
  getAll: async (params = {}) => {
    const users = filterItems(store.users, params).map((u) => ({
      ...u,
      hostelId: u.hostelId ? getHostel(u.hostelId) : null,
    }));
    const { data, pagination } = paginate(users, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const user = getUserById(id);
    if (!user) throw demoError('User not found', 404);
    return wrap(user);
  },
  create: async (payload) => {
    const user = {
      _id: makeId('demo-user'),
      uid: makeId('uid'),
      name: payload.name,
      email: payload.email,
      role: payload.role || 'student',
      approvalStatus: payload.role === 'warden' ? 'pending' : 'approved',
      hostelId: payload.hostelId || null,
      avatarUrl: payload.avatarUrl || '',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.users.unshift(user);
    return wrap(user);
  },
  update: async (id, payload) => {
    const existing = getUserById(id);
    if (!existing) throw demoError('User not found', 404);
    const next = { ...existing, ...payload, updatedAt: nowIso() };
    store.users = store.users.map((u) => (u._id === id ? next : u));
    return wrap(next);
  },
  delete: async (id) => {
    store.users = store.users.filter((u) => u._id !== id);
    return wrap({ deleted: true });
  },
  approveWarden: async (id) => {
    const existing = getUserById(id);
    if (!existing) throw demoError('User not found', 404);
    const next = { ...existing, approvalStatus: 'approved', updatedAt: nowIso() };
    store.users = store.users.map((u) => (u._id === id ? next : u));
    return wrap(next);
  },
  rejectWarden: async (id) => {
    const existing = getUserById(id);
    if (!existing) throw demoError('User not found', 404);
    const next = { ...existing, approvalStatus: 'rejected', updatedAt: nowIso() };
    store.users = store.users.map((u) => (u._id === id ? next : u));
    return wrap(next);
  },
};

export const feesApi = {
  getAll: async (params = {}) => {
    const current = getCurrentUser();
    let fees = [...store.fees];
    if (current.role === 'student') fees = fees.filter((f) => f.studentId === current._id);
    fees = filterItems(fees, params).map((f) => ({ ...f, studentId: getUserById(f.studentId) }));
    const { data, pagination } = paginate(fees, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const fee = store.fees.find((f) => f._id === id);
    if (!fee) throw demoError('Fee not found', 404);
    return wrap({ ...fee, studentId: getUserById(fee.studentId) });
  },
  create: async (payload) => {
    const fee = {
      _id: makeId('fee'),
      ...payload,
      amount: Number(payload.amount || 0),
      status: 'pending',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.fees.unshift(fee);
    return wrap(fee);
  },
  pay: async (id) => {
    const fee = store.fees.find((f) => f._id === id);
    if (!fee) throw demoError('Fee not found', 404);
    const next = { ...fee, status: 'paid', paidDate: nowIso(), updatedAt: nowIso() };
    store.fees = store.fees.map((f) => (f._id === id ? next : f));
    return wrap(next);
  },
};

export const complaintsApi = {
  getAll: async (params = {}) => {
    const current = getCurrentUser();
    let complaints = [...store.complaints];
    if (current.role === 'student') complaints = complaints.filter((c) => c.studentId === current._id);
    complaints = filterItems(complaints, params).map((c) => ({ ...c, studentId: getUserById(c.studentId) }));
    const { data, pagination } = paginate(complaints, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const complaint = store.complaints.find((c) => c._id === id);
    if (!complaint) throw demoError('Complaint not found', 404);
    return wrap({ ...complaint, studentId: getUserById(complaint.studentId) });
  },
  create: async (payload) => {
    const current = getCurrentUser();
    const complaint = {
      _id: makeId('complaint'),
      ...payload,
      studentId: current._id,
      status: 'open',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.complaints.unshift(complaint);
    return wrap(complaint);
  },
  resolve: async (id, payload = {}) => {
    const complaint = store.complaints.find((c) => c._id === id);
    if (!complaint) throw demoError('Complaint not found', 404);
    const next = {
      ...complaint,
      status: 'resolved',
      resolutionNotes: payload.resolutionNotes || '',
      resolvedAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.complaints = store.complaints.map((c) => (c._id === id ? next : c));
    return wrap(next);
  },
};

export const statsApi = {
  get: async () => {
    const totalBeds = store.rooms.reduce((sum, room) => sum + Number(room.capacity || 0), 0);
    const occupiedFromBookings = activeBookings().filter((b) => b.status === 'occupied').length;
    const occupiedFromAllotments = activeAllotments().length;
    const occupiedBeds = Math.max(occupiedFromBookings, occupiedFromAllotments);
    const vacantBeds = Math.max(totalBeds - occupiedBeds, 0);
    const occupancyRate = totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const stats = {
      hostels: store.hostels.length,
      rooms: store.rooms.length,
      students: store.users.filter((u) => u.role === 'student').length,
      occupancyRate,
      highOccupancy: occupancyRate >= 80,
      totalBeds,
      occupiedBeds,
      vacantBeds,
      activeAllotments: activeAllotments().length,
      totalRevenue: store.fees.filter((f) => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount || 0), 0),
      pendingFees: store.fees.filter((f) => f.status === 'pending').length,
      overdueFees: store.fees.filter((f) => f.status === 'overdue').length,
      paidFees: store.fees.filter((f) => f.status === 'paid').length,
      openComplaints: store.complaints.filter((c) => c.status !== 'resolved' && c.status !== 'closed').length,
      resolvedComplaints: store.complaints.filter((c) => c.status === 'resolved').length,
      closedComplaints: store.complaints.filter((c) => c.status === 'closed').length,
      pendingBookings: store.bookings.filter((b) => b.status === 'pending').length,
      approvedBookings: store.bookings.filter((b) => b.status === 'approved').length,
      occupiedBookings: store.bookings.filter((b) => b.status === 'occupied').length,
      pendingPayments: store.payments.filter((p) => p.status !== 'paid').length,
      paidPayments: store.payments.filter((p) => p.status === 'paid').length,
    };
    return wrap(stats);
  },
};

export const announcementsApi = {
  getAll: async (params = {}) => {
    const list = filterItems(store.announcements, params).map((a) => ({
      ...a,
      createdBy: getUserById(a.createdBy),
      hostelId: a.hostelId ? getHostel(a.hostelId) : null,
    }));
    const { data, pagination } = paginate(list, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const item = store.announcements.find((a) => a._id === id);
    if (!item) throw demoError('Announcement not found', 404);
    return wrap(item);
  },
  create: async (payload) => {
    const current = getCurrentUser();
    const item = {
      _id: makeId('announcement'),
      ...payload,
      createdBy: current._id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.announcements.unshift(item);
    return wrap(item);
  },
  update: async (id, payload) => {
    const existing = store.announcements.find((a) => a._id === id);
    if (!existing) throw demoError('Announcement not found', 404);
    const next = { ...existing, ...payload, updatedAt: nowIso() };
    store.announcements = store.announcements.map((a) => (a._id === id ? next : a));
    return wrap(next);
  },
  delete: async (id) => {
    store.announcements = store.announcements.filter((a) => a._id !== id);
    return wrap({ deleted: true });
  },
};

export const allotmentsApi = {
  getAll: async (params = {}) => {
    const current = getCurrentUser();
    let list = [...store.allotments];
    if (current.role === 'student') list = list.filter((a) => a.studentId === current._id);
    list = filterItems(list, params).map(enrichAllotment);
    const { data, pagination } = paginate(list, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const item = store.allotments.find((a) => a._id === id);
    if (!item) throw demoError('Allotment not found', 404);
    return wrap(enrichAllotment(item));
  },
  create: async (payload) => {
    const room = enrichRoom(store.rooms.find((r) => r._id === payload.roomId));
    if (!room) throw demoError('Room not found', 404);
    if (!room.availableBeds.length) throw demoError('No bed available in selected room');

    const allotment = {
      _id: makeId('allotment'),
      studentId: payload.studentId,
      roomId: payload.roomId,
      bedNumber: room.availableBeds[0],
      startDate: nowIso(),
      endDate: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.allotments.unshift(allotment);
    return wrap(enrichAllotment(allotment));
  },
  end: async (id) => {
    const existing = store.allotments.find((a) => a._id === id);
    if (!existing) throw demoError('Allotment not found', 404);
    const next = { ...existing, endDate: nowIso(), updatedAt: nowIso() };
    store.allotments = store.allotments.map((a) => (a._id === id ? next : a));
    return wrap(enrichAllotment(next));
  },
};

export const bookingsApi = {
  getAll: async (params = {}) => {
    const current = getCurrentUser();
    let list = [...store.bookings];
    if (current.role === 'student') list = list.filter((b) => b.studentId === current._id);
    list = filterItems(list, params).map(enrichBooking);
    const { data, pagination } = paginate(list, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const booking = store.bookings.find((b) => b._id === id);
    if (!booking) throw demoError('Booking not found', 404);
    return wrap(enrichBooking(booking));
  },
  getAvailableRooms: async () => wrap(store.rooms.map(enrichRoom)),
  create: async (payload) => {
    const current = getCurrentUser();
    const room = enrichRoom(store.rooms.find((r) => r._id === payload.roomId));
    if (!room) throw demoError('Room not found', 404);

    const bedNumber = Number(payload.bedNumber || 0);
    if (!room.availableBeds.includes(bedNumber)) throw demoError('Selected bed is not available');

    const existingActive = store.bookings.find(
      (b) => b.studentId === current._id && ['pending', 'approved', 'occupied'].includes(b.status)
    );
    if (existingActive) throw demoError('You already have an active booking request');

    const booking = {
      _id: makeId('booking'),
      studentId: current._id,
      roomId: payload.roomId,
      bedNumber,
      details: payload.details || '',
      amount: Number(payload.amount || 0),
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.bookings.unshift(booking);
    return wrap(enrichBooking(booking));
  },
  approve: async (id) => {
    const booking = store.bookings.find((b) => b._id === id);
    if (!booking) throw demoError('Booking not found', 404);
    const next = { ...booking, status: 'approved', updatedAt: nowIso() };
    store.bookings = store.bookings.map((b) => (b._id === id ? next : b));
    return wrap(enrichBooking(next));
  },
  reject: async (id, payload = {}) => {
    const booking = store.bookings.find((b) => b._id === id);
    if (!booking) throw demoError('Booking not found', 404);
    const next = {
      ...booking,
      status: 'rejected',
      rejectionReason: payload.rejectionReason || 'Rejected in demo',
      updatedAt: nowIso(),
    };
    store.bookings = store.bookings.map((b) => (b._id === id ? next : b));
    return wrap(enrichBooking(next));
  },
  pay: async (id, payload = {}) => {
    const booking = store.bookings.find((b) => b._id === id);
    if (!booking) throw demoError('Booking not found', 404);
    if (booking.status !== 'approved') throw demoError('Only approved bookings can be paid');

    const payment = {
      _id: makeId('payment'),
      bookingId: booking._id,
      studentId: booking.studentId,
      roomId: booking.roomId,
      bedNumber: booking.bedNumber,
      amount: booking.amount,
      status: 'paid',
      method: payload.method || 'upi',
      transactionRef: payload.transactionRef || '',
      proofUrl: payload.proofUrl || '',
      paidAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.payments.unshift(payment);

    const paidBooking = {
      ...booking,
      status: 'occupied',
      paymentStatus: 'paid',
      paidAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.bookings = store.bookings.map((b) => (b._id === id ? paidBooking : b));

    const hasActiveAllotment = store.allotments.some((a) => a.studentId === booking.studentId && !a.endDate);
    if (!hasActiveAllotment) {
      store.allotments.unshift({
        _id: makeId('allotment'),
        studentId: booking.studentId,
        roomId: booking.roomId,
        bedNumber: booking.bedNumber,
        bookingId: booking._id,
        startDate: nowIso(),
        endDate: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }

    return wrap({ booking: enrichBooking(paidBooking), payment: enrichPayment(payment) });
  },
};

export const paymentsApi = {
  getAll: async (params = {}) => {
    const current = getCurrentUser();
    let list = [...store.payments];
    if (current.role === 'student') list = list.filter((p) => p.studentId === current._id);
    list = filterItems(list, params).map(enrichPayment);
    const { data, pagination } = paginate(list, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const payment = store.payments.find((p) => p._id === id);
    if (!payment) throw demoError('Payment not found', 404);
    return wrap(enrichPayment(payment));
  },
};

export const leavesApi = {
  getAll: async (params = {}) => {
    const current = getCurrentUser();
    let list = [...store.leaves];
    if (current.role === 'student') list = list.filter((l) => l.studentId === current._id);
    list = filterItems(list, params).map((l) => ({ ...l, studentId: getUserById(l.studentId) }));
    const { data, pagination } = paginate(list, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const leave = store.leaves.find((l) => l._id === id);
    if (!leave) throw demoError('Leave request not found', 404);
    return wrap({ ...leave, studentId: getUserById(leave.studentId) });
  },
  create: async (payload) => {
    const current = getCurrentUser();
    const leave = {
      _id: makeId('leave'),
      ...payload,
      studentId: current._id,
      status: 'pending',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.leaves.unshift(leave);
    return wrap(leave);
  },
  approve: async (id) => {
    const existing = store.leaves.find((l) => l._id === id);
    if (!existing) throw demoError('Leave not found', 404);
    const next = {
      ...existing,
      status: 'approved',
      outpassCode: `OUT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      updatedAt: nowIso(),
    };
    store.leaves = store.leaves.map((l) => (l._id === id ? next : l));
    return wrap(next);
  },
  reject: async (id, payload = {}) => {
    const existing = store.leaves.find((l) => l._id === id);
    if (!existing) throw demoError('Leave not found', 404);
    const next = {
      ...existing,
      status: 'rejected',
      rejectionReason: payload.rejectionReason || 'Rejected in demo',
      updatedAt: nowIso(),
    };
    store.leaves = store.leaves.map((l) => (l._id === id ? next : l));
    return wrap(next);
  },
};

export const visitorsApi = {
  getAll: async (params = {}) => {
    const current = getCurrentUser();
    let list = [...store.visitors];
    if (current.role === 'student') list = list.filter((v) => v.studentId === current._id);
    list = filterItems(list, params).map((v) => ({ ...v, studentId: getUserById(v.studentId) }));
    const { data, pagination } = paginate(list, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const visitor = store.visitors.find((v) => v._id === id);
    if (!visitor) throw demoError('Visitor not found', 404);
    return wrap({ ...visitor, studentId: getUserById(visitor.studentId) });
  },
  create: async (payload) => {
    const current = getCurrentUser();
    const visitor = {
      _id: makeId('visitor'),
      ...payload,
      studentId: current.role === 'student' ? current._id : payload.studentId,
      checkInAt: nowIso(),
      checkOutAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.visitors.unshift(visitor);
    return wrap(visitor);
  },
  checkout: async (id) => {
    const existing = store.visitors.find((v) => v._id === id);
    if (!existing) throw demoError('Visitor not found', 404);
    const next = { ...existing, checkOutAt: nowIso(), updatedAt: nowIso() };
    store.visitors = store.visitors.map((v) => (v._id === id ? next : v));
    return wrap(next);
  },
};

export const uploadApi = {
  upload: async (file) => {
    const toDataUrl =
      (inputFile) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(demoError('Failed to read file'));
        reader.readAsDataURL(inputFile);
      });

    const url = await toDataUrl(file);
    return wrap({ url });
  },
};

export const getImageUrl = (path) => path || null;

export const signOutApiSession = async () => {};

export const switchDemoRoleSession = (role) => {
  localStorage.setItem('demoRole', role === 'admin' ? 'admin' : 'student');
};
