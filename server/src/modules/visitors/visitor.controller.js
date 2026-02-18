const visitorService = require('./visitor.service');
const ApiResponse = require('../../shared/utils/ApiResponse');
const ApiError = require('../../shared/utils/ApiError');

const getVisitors = async (req, res, next) => {
  try {
    const { page, limit, studentId, checkedOut } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (req.user.role === 'student') filter.studentId = req.user._id;
    if (checkedOut === 'true') filter.checkOutAt = { $ne: null };
    if (checkedOut === 'false') filter.checkOutAt = null;

    const result = await visitorService.getAll(filter, { page, limit });
    return ApiResponse.paginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getVisitor = async (req, res, next) => {
  try {
    const visitor = await visitorService.getById(req.params.id);
    const studentId = (visitor.studentId?._id || visitor.studentId)?.toString();
    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      throw ApiError.forbidden('Access denied');
    }
    return ApiResponse.success(res, visitor);
  } catch (error) {
    next(error);
  }
};

const createVisitor = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      checkInAt: req.body.checkInAt ? new Date(req.body.checkInAt) : new Date(),
      loggedBy: req.user._id,
    };
    const visitor = await visitorService.createVisitor(data);
    return ApiResponse.created(res, visitor);
  } catch (error) {
    next(error);
  }
};

const checkOutVisitor = async (req, res, next) => {
  try {
    const visitor = await visitorService.checkOut(req.params.id);
    return ApiResponse.success(res, visitor, 'Visitor checked out');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVisitors,
  getVisitor,
  createVisitor,
  checkOutVisitor,
};
