const ROLES = {
  ADMIN: 'admin',
  WARDEN: 'warden',
  ACCOUNTANT: 'accountant',
  STUDENT: 'student',
};

const ROOM_STATUS = {
  AVAILABLE: 'available',
  FULL: 'full',
  MAINTENANCE: 'maintenance',
};

const FEE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
};

const COMPLAINT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

const AUDIT_EVENTS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  ROOM_ALLOTMENT: 'room_allotment',
  FEE_PAYMENT: 'fee_payment',
  COMPLAINT_RESOLUTION: 'complaint_resolution',
};

module.exports = {
  ROLES,
  ROOM_STATUS,
  FEE_STATUS,
  COMPLAINT_STATUS,
  AUDIT_EVENTS,
};
