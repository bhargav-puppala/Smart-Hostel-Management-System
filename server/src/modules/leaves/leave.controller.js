const leaveService = require('./leave.service');
const ApiResponse = require('../../shared/utils/ApiResponse');
const ApiError = require('../../shared/utils/ApiError');

const getLeaves = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (req.user.role === 'student') filter.studentId = req.user._id;

    const result = await leaveService.getAll(filter, { page, limit });
    return ApiResponse.paginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.getById(req.params.id);
    const studentId = (leave.studentId?._id || leave.studentId)?.toString();
    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      throw ApiError.forbidden('Access denied');
    }
    return ApiResponse.success(res, leave);
  } catch (error) {
    next(error);
  }
};

const createLeave = async (req, res, next) => {
  try {
    const data = { ...req.body, studentId: req.user._id };
    const leave = await leaveService.createLeave(data);
    return ApiResponse.created(res, leave);
  } catch (error) {
    next(error);
  }
};

const approveLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.approveLeave(req.params.id, req.user._id);
    return ApiResponse.success(res, leave, 'Leave approved. Outpass generated.');
  } catch (error) {
    next(error);
  }
};

const rejectLeave = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    const leave = await leaveService.rejectLeave(req.params.id, req.user._id, rejectionReason);
    return ApiResponse.success(res, leave, 'Leave rejected');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaves,
  getLeave,
  createLeave,
  approveLeave,
  rejectLeave,
};
