const jwt = require('jsonwebtoken');
const User = require('../users/user.model');
const ApiError = require('../../shared/utils/ApiError');
const env = require('../../config/env');
const logger = require('../../shared/logger');
const { AUDIT_EVENTS } = require('../../shared/constants');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
};

const register = async (userData) => {
  if (!userData?.email) throw ApiError.badRequest('Email is required');
  const role = userData.role || 'student';
  if (!['warden', 'student'].includes(role)) {
    throw ApiError.badRequest('Self-registration only allowed for Warden or Student');
  }

  const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict('Email already registered');
  }

  const payload = { ...userData, role };
  if (role === 'warden') {
    payload.approvalStatus = 'pending';
    payload.isActive = false;
  } else {
    payload.approvalStatus = 'approved';
  }

  const user = await User.create(payload);
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;

  logger.info('User registered', { userId: user._id, email: user.email, role });

  if (role === 'warden') {
    return {
      user: userObj,
      message: 'Registration successful. Your account is pending admin approval. You will be notified once approved.',
      requiresApproval: true,
    };
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  return {
    user: userObj,
    accessToken,
    refreshToken,
    expiresIn: env.JWT_EXPIRES_IN,
  };
};

const login = async (email, password) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    logger.warn('Login attempt - user not found', { email });
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('Account is deactivated');
  }

  if (user.role === 'warden' && user.approvalStatus === 'pending') {
    throw ApiError.unauthorized('Your account is pending admin approval. Please wait for approval.');
  }

  if (user.role === 'warden' && user.approvalStatus === 'rejected') {
    throw ApiError.unauthorized('Your registration was rejected. Contact admin for details.');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    logger.warn('Login attempt - invalid password', { email });
    throw ApiError.unauthorized('Invalid email or password');
  }

  const { accessToken, refreshToken } = generateTokens(user._id);

  logger.info('User logged in', { userId: user._id, email: user.email });

  return {
    user: user.toJSON ? { ...user.toJSON(), password: undefined } : { ...user.toObject(), password: undefined },
    accessToken,
    refreshToken,
    expiresIn: env.JWT_EXPIRES_IN,
  };
};

const refreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    return generateTokens(user._id);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
};

const getMe = async (userId) => {
  const user = await User.findById(userId)
    .select('-password')
    .populate('hostelId', 'name address');
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
};

const updateProfile = async (userId, data) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  if (data.name !== undefined) user.name = data.name;
  if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
  if (data.password && data.password.length >= 6) user.password = data.password;

  await user.save();
  return getMe(userId);
};

module.exports = {
  register,
  login,
  refreshToken,
  getMe,
  updateProfile,
  generateTokens,
};
