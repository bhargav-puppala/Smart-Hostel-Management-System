const Complaint = require('./complaint.model');
const ApiError = require('../../shared/utils/ApiError');
const parsePagination = require('../../shared/utils/parsePagination');

const findById = async (id) => {
  const complaint = await Complaint.findById(id)
    .populate('studentId', 'name email')
    .populate('resolvedBy', 'name email');
  if (!complaint) throw ApiError.notFound('Complaint not found');
  return complaint;
};

const findAll = async (filter = {}, options = {}) => {
  const { page, limit } = parsePagination(options);
  const { sort = '-createdAt' } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Complaint.find(filter)
      .populate('studentId', 'name email')
      .populate('resolvedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Complaint.countDocuments(filter),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const create = async (data) => Complaint.create(data);

const updateById = async (id, data) => {
  const complaint = await Complaint.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('studentId', 'name email')
    .populate('resolvedBy', 'name email');
  if (!complaint) throw ApiError.notFound('Complaint not found');
  return complaint;
};

module.exports = { findById, findAll, create, updateById };
