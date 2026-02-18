const userService = require('./user.service');
const ApiResponse = require('../../shared/utils/ApiResponse');
const ApiError = require('../../shared/utils/ApiError');

const getUsers = async (req, res, next) => {
  try {
    const { page, limit, role, hostelId, isActive, approvalStatus } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (hostelId) filter.hostelId = hostelId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (approvalStatus) filter.approvalStatus = approvalStatus;

    const result = await userService.getAll(filter, { page, limit });
    return ApiResponse.paginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await userService.getById(req.params.id);
    return ApiResponse.success(res, user);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    return ApiResponse.created(res, user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return ApiResponse.success(res, user, 'User updated');
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    return ApiResponse.success(res, null, 'User deleted');
  } catch (error) {
    next(error);
  }
};

const approveWarden = async (req, res, next) => {
  try {
    const user = await userService.approveWarden(req.params.id);
    return ApiResponse.success(res, user, 'Warden approved successfully');
  } catch (error) {
    next(error);
  }
};

const rejectWarden = async (req, res, next) => {
  try {
    const user = await userService.rejectWarden(req.params.id);
    return ApiResponse.success(res, user, 'Warden rejected');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  approveWarden,
  rejectWarden,
};
