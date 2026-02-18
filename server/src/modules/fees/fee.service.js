const feeRepository = require('./fee.repository');
const ApiError = require('../../shared/utils/ApiError');
const { FEE_STATUS } = require('../../shared/constants');
const logger = require('../../shared/logger');

const getById = (id) => feeRepository.findById(id);
const getAll = (filter, options) => feeRepository.findAll(filter, options);

const createFee = async (data) => {
  return feeRepository.create(data);
};

const payFee = async (id) => {
  const fee = await feeRepository.findById(id);
  if (fee.status === FEE_STATUS.PAID) throw ApiError.badRequest('Fee already paid');
  const updated = await feeRepository.updateById(id, {
    status: FEE_STATUS.PAID,
    paidDate: new Date(),
  });
  logger.info('Fee payment recorded', { feeId: id, studentId: fee.studentId });
  return updated;
};

module.exports = { getById, getAll, createFee, payFee };
