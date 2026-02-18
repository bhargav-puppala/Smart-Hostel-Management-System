const Allotment = require('./allotment.model');
const ApiError = require('../../shared/utils/ApiError');
const parsePagination = require('../../shared/utils/parsePagination');

const findById = async (id) => {
  const allotment = await Allotment.findById(id)
    .populate('studentId', 'name email')
    .populate('roomId', 'roomNumber capacity hostelId');
  if (!allotment) throw ApiError.notFound('Allotment not found');
  return allotment;
};

const findAll = async (filter = {}, options = {}) => {
  const { page, limit } = parsePagination(options);
  const { sort = '-startDate' } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Allotment.find(filter)
      .populate('studentId', 'name email')
      .populate('roomId', 'roomNumber capacity hostelId')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Allotment.countDocuments(filter),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const create = async (data) => Allotment.create(data);

const updateById = async (id, data) => {
  const allotment = await Allotment.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('studentId', 'name email')
    .populate('roomId', 'roomNumber capacity hostelId');
  if (!allotment) throw ApiError.notFound('Allotment not found');
  return allotment;
};

module.exports = { findById, findAll, create, updateById };
