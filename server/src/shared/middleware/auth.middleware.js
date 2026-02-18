const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const ApiError = require('../utils/ApiError');
const User = require('../../modules/users/user.model');
const logger = require('../logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw ApiError.unauthorized('Access denied. No token provided.');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw ApiError.unauthorized('User not found.');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Account is deactivated.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(ApiError.unauthorized('Invalid token.'));
    } else if (error.name === 'TokenExpiredError') {
      next(ApiError.unauthorized('Token expired.'));
    } else {
      next(error);
    }
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.isActive) {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
};
