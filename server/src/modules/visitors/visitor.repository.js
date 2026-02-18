const Visitor = require('./visitor.model');
const ApiError = require('../../shared/utils/ApiError');
const parsePagination = require('../../shared/utils/parsePagination');

const findById = async (id) => {
  const visitor = await Visitor.findById(id)
    .populate('studentId', 'name email')
    .populate('loggedBy', 'name email');
  if (!visitor) throw ApiError.notFound('Visitor log not found');
  return visitor;
};

const findAll = async (filter = {}, options = {}) => {
  const { page, limit } = parsePagination(options);
  const { sort = '-checkInAt' } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Visitor.find(filter)
      .populate('studentId', 'name email')
      .populate('loggedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Visitor.countDocuments(filter),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const create = async (data) => Visitor.create(data);

const updateById = async (id, data) => {
  const visitor = await Visitor.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('studentId', 'name email')
    .populate('loggedBy', 'name email');
  if (!visitor) throw ApiError.notFound('Visitor log not found');
  return visitor;
};

module.exports = { findById, findAll, create, updateById };
