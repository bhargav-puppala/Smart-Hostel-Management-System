import { initializeApp, deleteApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  getIdToken,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, firebaseConfig, isFirebaseEnabled } from '../firebase/config';

const COLLECTIONS = {
  users: 'users',
  hostels: 'hostels',
  rooms: 'rooms',
  bookings: 'bookings',
  payments: 'payments',
  complaints: 'complaints',
  fees: 'fees',
  leaves: 'leaves',
  visitors: 'visitors',
  announcements: 'announcements',
  allotments: 'allotments',
};

const wrap = (data, pagination) => ({ data: { success: true, data, pagination } });

const createApiError = (message, status = 400) => {
  const error = new Error(message);
  error.response = { data: { message }, status };
  return error;
};

const ensureFirebaseReady = () => {
  if (isFirebaseEnabled && auth && db) return;
  throw createApiError('Firebase is not configured. Add VITE_FIREBASE_* env vars or enable demo mode.', 500);
};

const nowIso = () => new Date().toISOString();

const toEntity = (snap) => ({ _id: snap.id, ...snap.data() });

const isObject = (value) => value && typeof value === 'object';

const refId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (isObject(value)) return value._id || value.id || null;
  return null;
};

const getCollection = async (name) => {
  ensureFirebaseReady();
  const snap = await getDocs(collection(db, name));
  return snap.docs.map(toEntity);
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

const fileToDataUrl =
  (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(createApiError('Failed to read file'));
    reader.readAsDataURL(file);
  });

const getCurrentUserId = () => auth.currentUser?.uid || null;

const requireLogin = () => {
  ensureFirebaseReady();
  const uid = getCurrentUserId();
  if (!uid) throw createApiError('Please sign in first', 401);
  return uid;
};

const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
  return snap.exists() ? { _id: uid, ...snap.data() } : null;
};

const requireProfile = async () => {
  const uid = requireLogin();
  const profile = await getUserProfile(uid);
  if (!profile) throw createApiError('User profile not found', 404);
  return profile;
};

const ensureProfileForAuthUser = async (authUser, fallback = {}) => {
  const profileRef = doc(db, COLLECTIONS.users, authUser.uid);
  const profileSnap = await getDoc(profileRef);
  if (profileSnap.exists()) return { _id: authUser.uid, ...profileSnap.data() };

  const created = {
    name: fallback.name || authUser.displayName || 'User',
    email: authUser.email,
    role: fallback.role || 'student',
    approvalStatus: fallback.approvalStatus || 'approved',
    avatarUrl: fallback.avatarUrl || '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await setDoc(profileRef, created);
  return { _id: authUser.uid, ...created };
};

const createSecondaryAuthUser = async (email, password) => {
  const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    return credential.user.uid;
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp);
  }
};

const sortByCreatedAtDesc = (items) =>
  [...items].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

const filterByParams = (items, params = {}) => {
  const ignored = new Set(['page', 'limit']);
  return items.filter((item) => {
    for (const [key, value] of Object.entries(params)) {
      if (ignored.has(key) || value === undefined || value === null || value === '') continue;
      if (key === 'checkedOut') {
        const expected = String(value) === 'true';
        if (Boolean(item.checkOutAt) !== expected) return false;
        continue;
      }
      const itemValue = item[key];
      if (isObject(itemValue)) {
        if (refId(itemValue) !== String(value)) return false;
      } else if (String(itemValue) !== String(value)) {
        return false;
      }
    }
    return true;
  });
};

const enrichUsers = async (items) => {
  const hostels = await getCollection(COLLECTIONS.hostels);
  const hostelMap = new Map(hostels.map((h) => [h._id, h]));
  return items.map((item) => ({
    ...item,
    hostelId: refId(item.hostelId) ? hostelMap.get(refId(item.hostelId)) || null : null,
  }));
};

const getActiveAllotments = async () => {
  const allotments = await getCollection(COLLECTIONS.allotments);
  return allotments.filter((a) => !a.endDate);
};

const getActiveBookings = async () => {
  const bookings = await getCollection(COLLECTIONS.bookings);
  return bookings.filter((b) => ['pending', 'approved', 'occupied'].includes(b.status));
};

const computeRoomView = async (room) => {
  const [hostels, activeAllotments, activeBookings] = await Promise.all([
    getCollection(COLLECTIONS.hostels),
    getActiveAllotments(),
    getActiveBookings(),
  ]);

  const hostelMap = new Map(hostels.map((h) => [h._id, h]));
  const capacity = Number(room.capacity || 0);
  const bedNumbers = Array.from({ length: capacity }, (_, idx) => idx + 1);

  const roomAllotments = activeAllotments.filter((a) => refId(a.roomId) === room._id);
  const roomBookings = activeBookings.filter((b) => refId(b.roomId) === room._id);

  const occupiedBeds = new Set([
    ...roomAllotments.map((a) => Number(a.bedNumber)).filter(Boolean),
    ...roomBookings.filter((b) => b.status === 'occupied').map((b) => Number(b.bedNumber)).filter(Boolean),
  ]);

  const reservedBeds = new Set(
    roomBookings
      .filter((b) => ['pending', 'approved'].includes(b.status))
      .map((b) => Number(b.bedNumber))
      .filter(Boolean)
  );

  const beds = bedNumbers.map((bedNumber) => {
    if (occupiedBeds.has(bedNumber)) return { bedNumber, status: 'occupied' };
    if (reservedBeds.has(bedNumber)) return { bedNumber, status: 'reserved' };
    return { bedNumber, status: 'available' };
  });

  const availableBeds = beds.filter((b) => b.status === 'available').map((b) => b.bedNumber);
  const roomStatus = room.status === 'maintenance' ? 'maintenance' : availableBeds.length === 0 ? 'full' : 'available';

  return {
    ...room,
    status: roomStatus,
    hostelId: hostelMap.get(refId(room.hostelId)) || null,
    beds,
    availableBeds,
    reservedBeds: beds.filter((b) => b.status === 'reserved').map((b) => b.bedNumber),
    occupiedBeds: beds.filter((b) => b.status === 'occupied').map((b) => b.bedNumber),
    occupants: beds.filter((b) => b.status === 'occupied').map((b) => b.bedNumber),
  };
};

const enrichRooms = async (rooms) => Promise.all(rooms.map((room) => computeRoomView(room)));

const enrichRecords = async (items, type) => {
  const [users, rooms, hostels] = await Promise.all([
    getCollection(COLLECTIONS.users),
    getCollection(COLLECTIONS.rooms),
    getCollection(COLLECTIONS.hostels),
  ]);

  const userMap = new Map(users.map((u) => [u._id, u]));
  const hostelMap = new Map(hostels.map((h) => [h._id, h]));
  const roomMap = new Map(rooms.map((r) => [r._id, { ...r, hostelId: hostelMap.get(refId(r.hostelId)) || null }]));

  return items.map((item) => {
    if (type === 'fees' || type === 'complaints' || type === 'leaves' || type === 'visitors') {
      return { ...item, studentId: userMap.get(refId(item.studentId)) || null };
    }
    if (type === 'announcements') {
      return {
        ...item,
        createdBy: userMap.get(refId(item.createdBy)) || null,
        hostelId: refId(item.hostelId) ? hostelMap.get(refId(item.hostelId)) || null : null,
      };
    }
    if (type === 'allotments') {
      return {
        ...item,
        studentId: userMap.get(refId(item.studentId)) || null,
        roomId: roomMap.get(refId(item.roomId)) || null,
      };
    }
    if (type === 'bookings' || type === 'payments') {
      return {
        ...item,
        studentId: userMap.get(refId(item.studentId)) || null,
        roomId: roomMap.get(refId(item.roomId)) || null,
      };
    }
    return item;
  });
};

export const getImageUrl = (path) => path || null;

export const authApi = {
  login: async ({ email, password }) => {
    ensureFirebaseReady();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await ensureProfileForAuthUser(credential.user);
    return wrap({ user: profile, accessToken: 'firebase-session' });
  },

  register: async ({ name, email, password, role = 'student' }) => {
    ensureFirebaseReady();
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    const approvalStatus = role === 'warden' ? 'pending' : 'approved';
    const profile = await ensureProfileForAuthUser(credential.user, { name, role, approvalStatus });
    return wrap({
      user: profile,
      accessToken: 'firebase-session',
      requiresApproval: role === 'warden',
      message: role === 'warden' ? 'Registration successful. Your account is pending admin approval.' : 'Registration successful',
    });
  },

  me: async () => {
    ensureFirebaseReady();
    const user = auth.currentUser;
    if (!user) throw createApiError('Unauthorized', 401);
    const profile = await ensureProfileForAuthUser(user);
    return wrap(profile);
  },

  updateProfile: async (data) => {
    const uid = requireLogin();
    const updates = { updatedAt: nowIso() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl;

    if (data.name && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: data.name });
    }
    if (data.password && auth.currentUser) {
      await updatePassword(auth.currentUser, data.password);
    }

    await updateDoc(doc(db, COLLECTIONS.users, uid), updates);
    const profile = await getUserProfile(uid);
    return wrap(profile);
  },

  refreshToken: async () => {
    ensureFirebaseReady();
    if (!auth.currentUser) throw createApiError('Unauthorized', 401);
    const token = await getIdToken(auth.currentUser, true);
    return wrap({ accessToken: token });
  },
};

export const hostelsApi = {
  getAll: async (params = {}) => {
    const items = sortByCreatedAtDesc(filterByParams(await getCollection(COLLECTIONS.hostels), params));
    const { data, pagination } = paginate(items, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const snap = await getDoc(doc(db, COLLECTIONS.hostels, id));
    if (!snap.exists()) throw createApiError('Hostel not found', 404);
    return wrap({ _id: snap.id, ...snap.data() });
  },
  create: async (data) => {
    await requireProfile();
    const payload = { ...data, createdAt: nowIso(), updatedAt: nowIso() };
    const ref = await addDoc(collection(db, COLLECTIONS.hostels), payload);
    return wrap({ _id: ref.id, ...payload });
  },
  update: async (id, data) => {
    await requireProfile();
    await updateDoc(doc(db, COLLECTIONS.hostels, id), { ...data, updatedAt: nowIso() });
    const snap = await getDoc(doc(db, COLLECTIONS.hostels, id));
    return wrap({ _id: snap.id, ...snap.data() });
  },
  delete: async (id) => {
    await requireProfile();
    await deleteDoc(doc(db, COLLECTIONS.hostels, id));
    return wrap({ deleted: true });
  },
};

export const roomsApi = {
  getAll: async (params = {}) => {
    let rooms = await getCollection(COLLECTIONS.rooms);
    rooms = filterByParams(rooms, params);
    rooms = await enrichRooms(sortByCreatedAtDesc(rooms));
    const { data, pagination } = paginate(rooms, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const snap = await getDoc(doc(db, COLLECTIONS.rooms, id));
    if (!snap.exists()) throw createApiError('Room not found', 404);
    const room = await computeRoomView({ _id: snap.id, ...snap.data() });
    return wrap(room);
  },
  create: async (data) => {
    await requireProfile();
    const payload = {
      ...data,
      capacity: Number(data.capacity || 1),
      status: data.status || 'available',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const ref = await addDoc(collection(db, COLLECTIONS.rooms), payload);
    return wrap({ _id: ref.id, ...payload });
  },
  update: async (id, data) => {
    await requireProfile();
    const payload = { ...data, updatedAt: nowIso() };
    if (payload.capacity !== undefined) payload.capacity = Number(payload.capacity || 1);
    await updateDoc(doc(db, COLLECTIONS.rooms, id), payload);
    const snap = await getDoc(doc(db, COLLECTIONS.rooms, id));
    return wrap({ _id: snap.id, ...snap.data() });
  },
  delete: async (id) => {
    await requireProfile();
    await deleteDoc(doc(db, COLLECTIONS.rooms, id));
    return wrap({ deleted: true });
  },
};

export const usersApi = {
  getAll: async (params = {}) => {
    const current = await requireProfile();
    let users = await getCollection(COLLECTIONS.users);
    users = filterByParams(users, params);
    if (current.role !== 'admin') {
      users = users.filter((u) => u._id === current._id || u.role !== 'admin');
    }
    users = await enrichUsers(sortByCreatedAtDesc(users));
    const { data, pagination } = paginate(users, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    await requireProfile();
    const snap = await getDoc(doc(db, COLLECTIONS.users, id));
    if (!snap.exists()) throw createApiError('User not found', 404);
    const [user] = await enrichUsers([{ _id: snap.id, ...snap.data() }]);
    return wrap(user);
  },
  create: async (data) => {
    const current = await requireProfile();
    if (current.role !== 'admin') throw createApiError('Only admin can create users', 403);
    if (!data.password || data.password.length < 6) throw createApiError('Password must be at least 6 characters');

    const uid = await createSecondaryAuthUser(data.email, data.password);
    const approvalStatus = data.role === 'warden' ? 'pending' : 'approved';
    const payload = {
      name: data.name,
      email: data.email,
      role: data.role || 'student',
      hostelId: data.hostelId || null,
      avatarUrl: data.avatarUrl || '',
      approvalStatus,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await setDoc(doc(db, COLLECTIONS.users, uid), payload);
    return wrap({ _id: uid, ...payload });
  },
  update: async (id, data) => {
    const current = await requireProfile();
    if (current.role !== 'admin' && current._id !== id) throw createApiError('Not authorized', 403);
    if (data.password && current._id !== id) {
      throw createApiError('Cannot reset another user password from client app');
    }
    if (data.password && auth.currentUser) {
      await updatePassword(auth.currentUser, data.password);
    }

    const payload = { ...data, updatedAt: nowIso() };
    delete payload.password;
    await updateDoc(doc(db, COLLECTIONS.users, id), payload);
    const snap = await getDoc(doc(db, COLLECTIONS.users, id));
    return wrap({ _id: snap.id, ...snap.data() });
  },
  delete: async (id) => {
    const current = await requireProfile();
    if (current.role !== 'admin') throw createApiError('Only admin can delete users', 403);
    await deleteDoc(doc(db, COLLECTIONS.users, id));
    return wrap({ deleted: true });
  },
  approveWarden: async (id) => {
    const current = await requireProfile();
    if (current.role !== 'admin') throw createApiError('Only admin can approve wardens', 403);
    await updateDoc(doc(db, COLLECTIONS.users, id), { approvalStatus: 'approved', updatedAt: nowIso() });
    return wrap({ approved: true });
  },
  rejectWarden: async (id) => {
    const current = await requireProfile();
    if (current.role !== 'admin') throw createApiError('Only admin can reject wardens', 403);
    await updateDoc(doc(db, COLLECTIONS.users, id), { approvalStatus: 'rejected', updatedAt: nowIso() });
    return wrap({ rejected: true });
  },
};

export const feesApi = {
  getAll: async (params = {}) => {
    const current = await requireProfile();
    let fees = await getCollection(COLLECTIONS.fees);
    if (current.role === 'student') fees = fees.filter((f) => refId(f.studentId) === current._id);
    fees = filterByParams(fees, params);

    const now = Date.now();
    fees = fees.map((f) => {
      if (f.status === 'paid') return f;
      const dueAt = f.dueDate ? new Date(f.dueDate).getTime() : now;
      return { ...f, status: dueAt < now ? 'overdue' : 'pending' };
    });

    fees = sortByCreatedAtDesc(fees);
    fees = await enrichRecords(fees, 'fees');
    const { data, pagination } = paginate(fees, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    await requireProfile();
    const snap = await getDoc(doc(db, COLLECTIONS.fees, id));
    if (!snap.exists()) throw createApiError('Fee not found', 404);
    const [fee] = await enrichRecords([{ _id: snap.id, ...snap.data() }], 'fees');
    return wrap(fee);
  },
  create: async (data) => {
    const current = await requireProfile();
    if (!['admin', 'warden', 'accountant'].includes(current.role)) throw createApiError('Not authorized', 403);
    const payload = {
      ...data,
      amount: Number(data.amount || 0),
      status: 'pending',
      createdBy: current._id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const ref = await addDoc(collection(db, COLLECTIONS.fees), payload);
    return wrap({ _id: ref.id, ...payload });
  },
  pay: async (id) => {
    const current = await requireProfile();
    if (!['admin', 'accountant'].includes(current.role)) throw createApiError('Not authorized', 403);
    await updateDoc(doc(db, COLLECTIONS.fees, id), { status: 'paid', paidAt: nowIso(), updatedAt: nowIso() });
    return wrap({ paid: true });
  },
};

export const complaintsApi = {
  getAll: async (params = {}) => {
    const current = await requireProfile();
    let complaints = await getCollection(COLLECTIONS.complaints);
    if (current.role === 'student') complaints = complaints.filter((c) => refId(c.studentId) === current._id);
    complaints = sortByCreatedAtDesc(filterByParams(complaints, params));
    complaints = await enrichRecords(complaints, 'complaints');
    const { data, pagination } = paginate(complaints, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    await requireProfile();
    const snap = await getDoc(doc(db, COLLECTIONS.complaints, id));
    if (!snap.exists()) throw createApiError('Complaint not found', 404);
    const [complaint] = await enrichRecords([{ _id: snap.id, ...snap.data() }], 'complaints');
    return wrap(complaint);
  },
  create: async (data) => {
    const current = await requireProfile();
    if (current.role !== 'student') throw createApiError('Only students can create complaints', 403);
    const payload = {
      ...data,
      studentId: current._id,
      status: 'open',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const ref = await addDoc(collection(db, COLLECTIONS.complaints), payload);
    return wrap({ _id: ref.id, ...payload });
  },
  resolve: async (id, data = {}) => {
    const current = await requireProfile();
    if (!['admin', 'warden'].includes(current.role)) throw createApiError('Not authorized', 403);
    await updateDoc(doc(db, COLLECTIONS.complaints, id), {
      status: 'resolved',
      resolutionNotes: data.resolutionNotes || '',
      resolvedBy: current._id,
      resolvedAt: nowIso(),
      updatedAt: nowIso(),
    });
    return wrap({ resolved: true });
  },
};

export const statsApi = {
  get: async () => {
    const [hostels, rooms, users, fees, complaints, allotments, bookings, payments] = await Promise.all([
      getCollection(COLLECTIONS.hostels),
      getCollection(COLLECTIONS.rooms),
      getCollection(COLLECTIONS.users),
      getCollection(COLLECTIONS.fees),
      getCollection(COLLECTIONS.complaints),
      getCollection(COLLECTIONS.allotments),
      getCollection(COLLECTIONS.bookings),
      getCollection(COLLECTIONS.payments),
    ]);

    const totalBeds = rooms.reduce((sum, room) => sum + Number(room.capacity || 0), 0);
    const activeAllotments = allotments.filter((a) => !a.endDate);
    const occupiedByAllotments = activeAllotments.length;
    const occupiedByBookings = bookings.filter((b) => b.status === 'occupied').length;
    const occupiedBeds = Math.max(occupiedByAllotments, occupiedByBookings);

    const stats = {
      hostels: hostels.length,
      rooms: rooms.length,
      students: users.filter((u) => u.role === 'student').length,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      activeAllotments: activeAllotments.length,
      totalRevenue: fees.filter((f) => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount || 0), 0),
      pendingFees: fees.filter((f) => f.status === 'pending').length,
      overdueFees: fees.filter((f) => f.status === 'overdue').length,
      paidFees: fees.filter((f) => f.status === 'paid').length,
      openComplaints: complaints.filter((c) => ['open', 'in_progress'].includes(c.status)).length,
      resolvedComplaints: complaints.filter((c) => c.status === 'resolved').length,
      closedComplaints: complaints.filter((c) => c.status === 'closed').length,
      pendingBookings: bookings.filter((b) => b.status === 'pending').length,
      approvedBookings: bookings.filter((b) => b.status === 'approved').length,
      occupiedBookings: bookings.filter((b) => b.status === 'occupied').length,
      pendingPayments: payments.filter((p) => p.status !== 'paid').length,
      paidPayments: payments.filter((p) => p.status === 'paid').length,
    };
    return wrap(stats);
  },
};

export const announcementsApi = {
  getAll: async (params = {}) => {
    let items = await getCollection(COLLECTIONS.announcements);
    items = sortByCreatedAtDesc(filterByParams(items, params));
    items = await enrichRecords(items, 'announcements');
    const { data, pagination } = paginate(items, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const snap = await getDoc(doc(db, COLLECTIONS.announcements, id));
    if (!snap.exists()) throw createApiError('Announcement not found', 404);
    const [item] = await enrichRecords([{ _id: snap.id, ...snap.data() }], 'announcements');
    return wrap(item);
  },
  create: async (data) => {
    const current = await requireProfile();
    if (!['admin', 'warden'].includes(current.role)) throw createApiError('Not authorized', 403);
    const payload = {
      ...data,
      createdBy: current._id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const ref = await addDoc(collection(db, COLLECTIONS.announcements), payload);
    return wrap({ _id: ref.id, ...payload });
  },
  update: async (id, data) => {
    const current = await requireProfile();
    if (!['admin', 'warden'].includes(current.role)) throw createApiError('Not authorized', 403);
    await updateDoc(doc(db, COLLECTIONS.announcements, id), { ...data, updatedAt: nowIso() });
    return wrap({ updated: true });
  },
  delete: async (id) => {
    const current = await requireProfile();
    if (!['admin', 'warden'].includes(current.role)) throw createApiError('Not authorized', 403);
    await deleteDoc(doc(db, COLLECTIONS.announcements, id));
    return wrap({ deleted: true });
  },
};

export const allotmentsApi = {
  getAll: async (params = {}) => {
    const current = await requireProfile();
    let allotments = await getCollection(COLLECTIONS.allotments);
    if (current.role === 'student') allotments = allotments.filter((a) => refId(a.studentId) === current._id);
    allotments = sortByCreatedAtDesc(filterByParams(allotments, params));
    allotments = await enrichRecords(allotments, 'allotments');
    const { data, pagination } = paginate(allotments, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const snap = await getDoc(doc(db, COLLECTIONS.allotments, id));
    if (!snap.exists()) throw createApiError('Allotment not found', 404);
    const [item] = await enrichRecords([{ _id: snap.id, ...snap.data() }], 'allotments');
    return wrap(item);
  },
  create: async (data) => {
    const current = await requireProfile();
    if (!['admin', 'warden'].includes(current.role)) throw createApiError('Not authorized', 403);

    const rooms = await enrichRooms(await getCollection(COLLECTIONS.rooms));
    const room = rooms.find((r) => r._id === data.roomId);
    if (!room) throw createApiError('Room not found', 404);
    if (!room.availableBeds.length) throw createApiError('No bed available in selected room');

    const activeForStudent = (await getCollection(COLLECTIONS.allotments)).find(
      (a) => refId(a.studentId) === data.studentId && !a.endDate
    );
    if (activeForStudent) throw createApiError('Student already has an active allotment');

    const payload = {
      studentId: data.studentId,
      roomId: data.roomId,
      bedNumber: room.availableBeds[0],
      startDate: nowIso(),
      createdBy: current._id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const ref = await addDoc(collection(db, COLLECTIONS.allotments), payload);
    return wrap({ _id: ref.id, ...payload });
  },
  end: async (id) => {
    const current = await requireProfile();
    if (!['admin', 'warden'].includes(current.role)) throw createApiError('Not authorized', 403);
    await updateDoc(doc(db, COLLECTIONS.allotments, id), { endDate: nowIso(), updatedAt: nowIso() });
    return wrap({ ended: true });
  },
};

export const bookingsApi = {
  getAll: async (params = {}) => {
    const current = await requireProfile();
    let bookings = await getCollection(COLLECTIONS.bookings);
    if (current.role === 'student') bookings = bookings.filter((b) => refId(b.studentId) === current._id);
    bookings = sortByCreatedAtDesc(filterByParams(bookings, params));
    bookings = await enrichRecords(bookings, 'bookings');
    const { data, pagination } = paginate(bookings, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const snap = await getDoc(doc(db, COLLECTIONS.bookings, id));
    if (!snap.exists()) throw createApiError('Booking not found', 404);
    const [item] = await enrichRecords([{ _id: snap.id, ...snap.data() }], 'bookings');
    return wrap(item);
  },
  getAvailableRooms: async () => {
    const rooms = await enrichRooms(await getCollection(COLLECTIONS.rooms));
    return wrap(rooms.filter((room) => room.status !== 'maintenance'));
  },
  create: async (data) => {
    const current = await requireProfile();
    if (current.role !== 'student') throw createApiError('Only students can create booking requests', 403);

    const activeStudentBooking = (await getCollection(COLLECTIONS.bookings)).find(
      (b) => refId(b.studentId) === current._id && ['pending', 'approved', 'occupied'].includes(b.status)
    );
    if (activeStudentBooking) throw createApiError('You already have an active booking request');

    const room = await computeRoomView({ _id: data.roomId, ...(await (async () => {
      const snap = await getDoc(doc(db, COLLECTIONS.rooms, data.roomId));
      if (!snap.exists()) throw createApiError('Room not found', 404);
      return snap.data();
    })()) });

    const bedNumber = Number(data.bedNumber || 0);
    if (!room.availableBeds.includes(bedNumber)) throw createApiError('Selected bed is not available');

    const payload = {
      studentId: current._id,
      roomId: data.roomId,
      bedNumber,
      details: data.details || '',
      amount: Number(data.amount || 0),
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const ref = await addDoc(collection(db, COLLECTIONS.bookings), payload);
    return wrap({ _id: ref.id, ...payload });
  },
  approve: async (id) => {
    const current = await requireProfile();
    if (!['admin', 'warden'].includes(current.role)) throw createApiError('Not authorized', 403);
    const bookingRef = doc(db, COLLECTIONS.bookings, id);
    const bookingSnap = await getDoc(bookingRef);
    if (!bookingSnap.exists()) throw createApiError('Booking not found', 404);
    const booking = { _id: bookingSnap.id, ...bookingSnap.data() };
    if (booking.status !== 'pending') throw createApiError('Only pending bookings can be approved');

    await updateDoc(bookingRef, { status: 'approved', approvedBy: current._id, approvedAt: nowIso(), updatedAt: nowIso() });
    return wrap({ approved: true });
  },
  reject: async (id, data = {}) => {
    const current = await requireProfile();
    if (!['admin', 'warden'].includes(current.role)) throw createApiError('Not authorized', 403);
    const bookingRef = doc(db, COLLECTIONS.bookings, id);
    const bookingSnap = await getDoc(bookingRef);
    if (!bookingSnap.exists()) throw createApiError('Booking not found', 404);
    await updateDoc(bookingRef, {
      status: 'rejected',
      rejectionReason: data.rejectionReason || '',
      rejectedBy: current._id,
      rejectedAt: nowIso(),
      updatedAt: nowIso(),
    });
    return wrap({ rejected: true });
  },
  pay: async (id, data = {}) => {
    const current = await requireProfile();
    const bookingRef = doc(db, COLLECTIONS.bookings, id);
    const bookingSnap = await getDoc(bookingRef);
    if (!bookingSnap.exists()) throw createApiError('Booking not found', 404);
    const booking = { _id: bookingSnap.id, ...bookingSnap.data() };

    const isOwner = refId(booking.studentId) === current._id;
    const canManage = ['admin', 'warden'].includes(current.role);
    if (!isOwner && !canManage) throw createApiError('Not authorized', 403);
    if (booking.status !== 'approved' || booking.paymentStatus === 'paid') {
      throw createApiError('Booking is not payable');
    }

    const paymentPayload = {
      bookingId: booking._id,
      studentId: refId(booking.studentId),
      roomId: refId(booking.roomId),
      bedNumber: Number(booking.bedNumber),
      amount: Number(booking.amount || 0),
      status: 'paid',
      method: data.method || 'upi',
      transactionRef: data.transactionRef || '',
      proofUrl: data.proofUrl || '',
      paidAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await addDoc(collection(db, COLLECTIONS.payments), paymentPayload);

    await updateDoc(bookingRef, {
      status: 'occupied',
      paymentStatus: 'paid',
      paidAt: nowIso(),
      updatedAt: nowIso(),
    });

    const activeAllotment = (await getCollection(COLLECTIONS.allotments)).find(
      (a) => refId(a.studentId) === refId(booking.studentId) && !a.endDate
    );
    if (!activeAllotment) {
      await addDoc(collection(db, COLLECTIONS.allotments), {
        studentId: refId(booking.studentId),
        roomId: refId(booking.roomId),
        bedNumber: Number(booking.bedNumber),
        bookingId: booking._id,
        startDate: nowIso(),
        createdBy: current._id,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    }

    return wrap({ paid: true });
  },
};

export const paymentsApi = {
  getAll: async (params = {}) => {
    const current = await requireProfile();
    let payments = await getCollection(COLLECTIONS.payments);
    if (current.role === 'student') payments = payments.filter((p) => refId(p.studentId) === current._id);
    payments = sortByCreatedAtDesc(filterByParams(payments, params));
    payments = await enrichRecords(payments, 'payments');
    const { data, pagination } = paginate(payments, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const snap = await getDoc(doc(db, COLLECTIONS.payments, id));
    if (!snap.exists()) throw createApiError('Payment not found', 404);
    const [payment] = await enrichRecords([{ _id: snap.id, ...snap.data() }], 'payments');
    return wrap(payment);
  },
};

export const leavesApi = {
  getAll: async (params = {}) => {
    const current = await requireProfile();
    let leaves = await getCollection(COLLECTIONS.leaves);
    if (current.role === 'student') leaves = leaves.filter((l) => refId(l.studentId) === current._id);
    leaves = sortByCreatedAtDesc(filterByParams(leaves, params));
    leaves = await enrichRecords(leaves, 'leaves');
    const { data, pagination } = paginate(leaves, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const snap = await getDoc(doc(db, COLLECTIONS.leaves, id));
    if (!snap.exists()) throw createApiError('Leave request not found', 404);
    const [leave] = await enrichRecords([{ _id: snap.id, ...snap.data() }], 'leaves');
    return wrap(leave);
  },
  create: async (data) => {
    const current = await requireProfile();
    if (current.role !== 'student') throw createApiError('Only students can request leave', 403);
    const payload = {
      ...data,
      studentId: current._id,
      status: 'pending',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const ref = await addDoc(collection(db, COLLECTIONS.leaves), payload);
    return wrap({ _id: ref.id, ...payload });
  },
  approve: async (id) => {
    const current = await requireProfile();
    if (!['admin', 'warden'].includes(current.role)) throw createApiError('Not authorized', 403);
    await updateDoc(doc(db, COLLECTIONS.leaves, id), {
      status: 'approved',
      approvedBy: current._id,
      approvedAt: nowIso(),
      outpassCode: `OUT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      updatedAt: nowIso(),
    });
    return wrap({ approved: true });
  },
  reject: async (id, data = {}) => {
    const current = await requireProfile();
    if (!['admin', 'warden'].includes(current.role)) throw createApiError('Not authorized', 403);
    await updateDoc(doc(db, COLLECTIONS.leaves, id), {
      status: 'rejected',
      rejectionReason: data.rejectionReason || '',
      rejectedBy: current._id,
      rejectedAt: nowIso(),
      updatedAt: nowIso(),
    });
    return wrap({ rejected: true });
  },
};

export const visitorsApi = {
  getAll: async (params = {}) => {
    const current = await requireProfile();
    let visitors = await getCollection(COLLECTIONS.visitors);
    if (current.role === 'student') visitors = visitors.filter((v) => refId(v.studentId) === current._id);
    visitors = sortByCreatedAtDesc(filterByParams(visitors, params));
    visitors = await enrichRecords(visitors, 'visitors');
    const { data, pagination } = paginate(visitors, params);
    return wrap(data, pagination);
  },
  getOne: async (id) => {
    const snap = await getDoc(doc(db, COLLECTIONS.visitors, id));
    if (!snap.exists()) throw createApiError('Visitor record not found', 404);
    const [visitor] = await enrichRecords([{ _id: snap.id, ...snap.data() }], 'visitors');
    return wrap(visitor);
  },
  create: async (data) => {
    const current = await requireProfile();
    const studentId = current.role === 'student' ? current._id : data.studentId;
    if (!studentId) throw createApiError('Student is required');

    const payload = {
      ...data,
      studentId,
      checkInAt: nowIso(),
      checkOutAt: null,
      createdBy: current._id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const ref = await addDoc(collection(db, COLLECTIONS.visitors), payload);
    return wrap({ _id: ref.id, ...payload });
  },
  checkout: async (id) => {
    const current = await requireProfile();
    if (!['admin', 'warden'].includes(current.role)) throw createApiError('Not authorized', 403);
    await updateDoc(doc(db, COLLECTIONS.visitors, id), { checkOutAt: nowIso(), updatedAt: nowIso() });
    return wrap({ checkedOut: true });
  },
};

export const uploadApi = {
  upload: async (file) => {
    const url = await fileToDataUrl(file);
    return wrap({ url });
  },
};

const api = {
  authApi,
  hostelsApi,
  roomsApi,
  usersApi,
  feesApi,
  complaintsApi,
  statsApi,
  announcementsApi,
  allotmentsApi,
  bookingsApi,
  paymentsApi,
  leavesApi,
  visitorsApi,
  uploadApi,
};

export const signOutApiSession = async () => {
  if (auth.currentUser) await signOut(auth);
};

export default api;
