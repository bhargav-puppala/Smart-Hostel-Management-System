const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const errorHandler = require('./shared/middleware/errorHandler.middleware');

const authRoutes = require('./modules/auth/auth.routes');
const uploadRoutes = require('./modules/upload/upload.routes');
const statsRoutes = require('./modules/stats/stats.routes');
const userRoutes = require('./modules/users/user.routes');
const hostelRoutes = require('./modules/hostels/hostel.routes');
const roomRoutes = require('./modules/rooms/room.routes');
const allotmentRoutes = require('./modules/allotments/allotment.routes');
const feeRoutes = require('./modules/fees/fee.routes');
const complaintRoutes = require('./modules/complaints/complaint.routes');
const announcementRoutes = require('./modules/announcements/announcement.routes');
const leaveRoutes = require('./modules/leaves/leave.routes');
const visitorRoutes = require('./modules/visitors/visitor.routes');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.includes(',') ? env.CORS_ORIGIN.split(',').map((o) => o.trim()) : env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Hostlr API is running' });
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/hostels', hostelRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/allotments', allotmentRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/visitors', visitorRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
