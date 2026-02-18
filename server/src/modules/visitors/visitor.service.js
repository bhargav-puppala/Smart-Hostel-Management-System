const visitorRepository = require('./visitor.repository');
const ApiError = require('../../shared/utils/ApiError');

const getById = (id) => visitorRepository.findById(id);
const getAll = (filter, options) => visitorRepository.findAll(filter, options);

const createVisitor = async (data) => {
  return visitorRepository.create(data);
};

const checkOut = async (id) => {
  const visitor = await visitorRepository.findById(id);
  if (visitor.checkOutAt) {
    throw ApiError.badRequest('Visitor already checked out');
  }
  return visitorRepository.updateById(id, { checkOutAt: new Date() });
};

module.exports = { getById, getAll, createVisitor, checkOut };
