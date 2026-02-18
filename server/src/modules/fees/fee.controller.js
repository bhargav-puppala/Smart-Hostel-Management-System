const feeService = require('./fee.service');
const ApiResponse = require('../../shared/utils/ApiResponse');

const getFees = async (req, res, next) => {
  try {
    const { page, limit, studentId, status } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;
    if (req.user.role === 'student') filter.studentId = req.user._id;

    const result = await feeService.getAll(filter, { page, limit });
    return ApiResponse.paginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getFee = async (req, res, next) => {
  try {
    const fee = await feeService.getById(req.params.id);
    const studentId = (fee.studentId?._id || fee.studentId)?.toString();
    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      const ApiError = require('../../shared/utils/ApiError');
      throw ApiError.forbidden('Access denied');
    }
    return ApiResponse.success(res, fee);
  } catch (error) {
    next(error);
  }
};

const createFee = async (req, res, next) => {
  try {
    const fee = await feeService.createFee(req.body);
    return ApiResponse.created(res, fee);
  } catch (error) {
    next(error);
  }
};

const payFee = async (req, res, next) => {
  try {
    const fee = await feeService.payFee(req.params.id);
    return ApiResponse.success(res, fee, 'Fee paid successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getFees, getFee, createFee, payFee };
