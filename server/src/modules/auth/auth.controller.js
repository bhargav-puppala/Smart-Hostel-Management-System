const authService = require('./auth.service');
const ApiResponse = require('../../shared/utils/ApiResponse');
const ApiError = require('../../shared/utils/ApiError');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return ApiResponse.created(res, result, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }
    const result = await authService.login(email, password);
    return ApiResponse.success(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw ApiError.badRequest('Refresh token is required');
    }
    const tokens = await authService.refreshToken(refreshToken);
    return ApiResponse.success(res, tokens, 'Token refreshed');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user._id);
    return ApiResponse.success(res, user, 'Profile retrieved');
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user._id, req.body);
    return ApiResponse.success(res, user, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getMe,
  updateProfile,
};
