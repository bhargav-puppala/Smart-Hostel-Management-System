const leaveRepository = require('./leave.repository');
const ApiError = require('../../shared/utils/ApiError');
const { LEAVE_STATUS } = require('../../shared/constants');
const logger = require('../../shared/logger');

const getById = (id) => leaveRepository.findById(id);
const getAll = (filter, options) => leaveRepository.findAll(filter, options);

const createLeave = async (data) => {
  return leaveRepository.create(data);
};

const generateOutpassCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'OP-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const approveLeave = async (id, userId) => {
  const leave = await leaveRepository.findById(id);
  if (leave.status !== LEAVE_STATUS.PENDING) {
    throw ApiError.badRequest('Leave request is not pending');
  }
  const outpassCode = generateOutpassCode();
  const updated = await leaveRepository.updateById(id, {
    status: LEAVE_STATUS.APPROVED,
    approvedBy: userId,
    approvedAt: new Date(),
    outpassCode,
    rejectionReason: null,
  });
  logger.info('Leave approved', { leaveId: id, approvedBy: userId, outpassCode });
  return updated;
};

const rejectLeave = async (id, userId, rejectionReason) => {
  const leave = await leaveRepository.findById(id);
  if (leave.status !== LEAVE_STATUS.PENDING) {
    throw ApiError.badRequest('Leave request is not pending');
  }
  const updated = await leaveRepository.updateById(id, {
    status: LEAVE_STATUS.REJECTED,
    approvedBy: userId,
    approvedAt: new Date(),
    rejectionReason: rejectionReason || 'No reason provided',
  });
  logger.info('Leave rejected', { leaveId: id, rejectedBy: userId });
  return updated;
};

module.exports = { getById, getAll, createLeave, approveLeave, rejectLeave };
