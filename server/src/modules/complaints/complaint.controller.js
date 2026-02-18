const complaintService = require('./complaint.service');
const ApiResponse = require('../../shared/utils/ApiResponse');
const ApiError = require('../../shared/utils/ApiError');

const getComplaints = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (req.user.role === 'student') filter.studentId = req.user._id;

    const result = await complaintService.getAll(filter, { page, limit });
    return ApiResponse.paginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getComplaint = async (req, res, next) => {
  try {
    const complaint = await complaintService.getById(req.params.id);
    const studentId = (complaint.studentId?._id || complaint.studentId)?.toString();
    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      throw ApiError.forbidden('Access denied');
    }
    return ApiResponse.success(res, complaint);
  } catch (error) {
    next(error);
  }
};

const createComplaint = async (req, res, next) => {
  try {
    const data = { ...req.body, studentId: req.user._id };
    const complaint = await complaintService.createComplaint(data);
    return ApiResponse.created(res, complaint);
  } catch (error) {
    next(error);
  }
};

const resolveComplaint = async (req, res, next) => {
  try {
    const { resolutionNotes } = req.body;
    const complaint = await complaintService.resolveComplaint(req.params.id, req.user._id, resolutionNotes);
    return ApiResponse.success(res, complaint, 'Complaint resolved');
  } catch (error) {
    next(error);
  }
};

const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const complaint = await complaintService.updateStatus(req.params.id, status);
    return ApiResponse.success(res, complaint, 'Status updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComplaints,
  getComplaint,
  createComplaint,
  resolveComplaint,
  updateComplaintStatus,
};
