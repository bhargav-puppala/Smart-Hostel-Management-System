require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'default-secret-change-me') {
  console.warn('[SECURITY] JWT_SECRET is using default value. Set JWT_SECRET in production.');
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/hostlr',
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

module.exports = env;
