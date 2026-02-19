const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
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

// Trust proxy when behind nginx, load balancer, etc.
app.set('trust proxy', 1);

// Helmet: allow cross-origin API requests from frontend
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS: flexible origin validation for deployment (handles trailing slash, multiple origins)
const allowedOrigins = env.CORS_ORIGINS.map((o) => o.replace(/\/$/, ''));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      const allowed = allowedOrigins.some((a) => normalized === a || origin === a);
      callback(null, allowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// No rate limiter on public routes (auth/register, auth/login, auth/refresh-token)
// Private routes use user-ID-based rate limiting (see each router) since hostelers share the same public IP

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
