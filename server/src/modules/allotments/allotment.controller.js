const allotmentService = require('./allotment.service');
const ApiResponse = require('../../shared/utils/ApiResponse');
const ApiError = require('../../shared/utils/ApiError');

const getAllotments = async (req, res, next) => {
  try {
    const { page, limit, studentId, roomId } = req.query;
    const filter = {};
    if (req.user.role === 'student') {
      filter.studentId = req.user._id;
    } else {
      if (studentId) filter.studentId = studentId;
    }
    if (roomId) filter.roomId = roomId;

    const result = await allotmentService.getAll(filter, { page, limit });
    return ApiResponse.paginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getAllotment = async (req, res, next) => {
  try {
    const allotment = await allotmentService.getById(req.params.id);
    if (req.user.role === 'student' && allotment.studentId?.toString() !== req.user._id.toString()) {
      return next(ApiError.forbidden('You can only view your own allotment'));
    }
    return ApiResponse.success(res, allotment);
  } catch (error) {
    next(error);
  }
};

const createAllotment = async (req, res, next) => {
  try {
    const allotment = await allotmentService.createAllotment(req.body);
    return ApiResponse.created(res, allotment);
  } catch (error) {
    next(error);
  }
};

const endAllotment = async (req, res, next) => {
  try {
    const allotment = await allotmentService.endAllotment(req.params.id);
    return ApiResponse.success(res, allotment, 'Allotment ended');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllotments, getAllotment, createAllotment, endAllotment };
