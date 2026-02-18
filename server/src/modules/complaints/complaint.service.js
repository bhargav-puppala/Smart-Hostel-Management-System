const complaintRepository = require('./complaint.repository');
const ApiError = require('../../shared/utils/ApiError');
const { COMPLAINT_STATUS } = require('../../shared/constants');
const logger = require('../../shared/logger');

const getById = (id) => complaintRepository.findById(id);
const getAll = (filter, options) => complaintRepository.findAll(filter, options);

const createComplaint = async (data) => {
  return complaintRepository.create(data);
};

const resolveComplaint = async (id, userId, resolutionNotes) => {
  const complaint = await complaintRepository.findById(id);
  if (complaint.status === COMPLAINT_STATUS.RESOLVED || complaint.status === COMPLAINT_STATUS.CLOSED) {
    throw ApiError.badRequest('Complaint already resolved');
  }
  const updated = await complaintRepository.updateById(id, {
    status: COMPLAINT_STATUS.RESOLVED,
    resolvedBy: userId,
    resolvedAt: new Date(),
    resolutionNotes,
  });
  logger.info('Complaint resolved', { complaintId: id, resolvedBy: userId });
  return updated;
};

const updateStatus = async (id, status) => {
  return complaintRepository.updateById(id, { status });
};

module.exports = { getById, getAll, createComplaint, resolveComplaint, updateStatus };
