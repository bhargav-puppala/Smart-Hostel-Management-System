const Fee = require('./fee.model');
const ApiError = require('../../shared/utils/ApiError');
const parsePagination = require('../../shared/utils/parsePagination');

const findById = async (id) => {
  const fee = await Fee.findById(id).populate('studentId', 'name email');
  if (!fee) throw ApiError.notFound('Fee record not found');
  return fee;
};

const findAll = async (filter = {}, options = {}) => {
  const { page, limit } = parsePagination(options);
  const { sort = '-dueDate' } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Fee.find(filter).populate('studentId', 'name email').sort(sort).skip(skip).limit(limit).lean(),
    Fee.countDocuments(filter),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const create = async (data) => Fee.create(data);

const updateById = async (id, data) => {
  const fee = await Fee.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate(
    'studentId',
    'name email'
  );
  if (!fee) throw ApiError.notFound('Fee record not found');
  return fee;
};

module.exports = { findById, findAll, create, updateById };
