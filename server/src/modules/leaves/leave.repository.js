const Leave = require('./leave.model');
const ApiError = require('../../shared/utils/ApiError');
const parsePagination = require('../../shared/utils/parsePagination');

const findById = async (id) => {
  const leave = await Leave.findById(id)
    .populate('studentId', 'name email')
    .populate('approvedBy', 'name email');
  if (!leave) throw ApiError.notFound('Leave request not found');
  return leave;
};

const findAll = async (filter = {}, options = {}) => {
  const { page, limit } = parsePagination(options);
  const { sort = '-createdAt' } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Leave.find(filter)
      .populate('studentId', 'name email')
      .populate('approvedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Leave.countDocuments(filter),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const create = async (data) => Leave.create(data);

const updateById = async (id, data) => {
  const leave = await Leave.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('studentId', 'name email')
    .populate('approvedBy', 'name email');
  if (!leave) throw ApiError.notFound('Leave request not found');
  return leave;
};

module.exports = { findById, findAll, create, updateById };
