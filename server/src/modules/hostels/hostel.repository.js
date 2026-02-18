const Hostel = require('./hostel.model');
const ApiError = require('../../shared/utils/ApiError');
const parsePagination = require('../../shared/utils/parsePagination');

const findById = async (id) => {
  const hostel = await Hostel.findById(id);
  if (!hostel) throw ApiError.notFound('Hostel not found');
  return hostel;
};

const findAll = async (filter = {}, options = {}) => {
  const { page, limit } = parsePagination(options);
  const { sort = '-createdAt' } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Hostel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Hostel.countDocuments(filter),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const create = async (data) => Hostel.create(data);

const updateById = async (id, data) => {
  const hostel = await Hostel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!hostel) throw ApiError.notFound('Hostel not found');
  return hostel;
};

const deleteById = async (id) => {
  const hostel = await Hostel.findByIdAndDelete(id);
  if (!hostel) throw ApiError.notFound('Hostel not found');
  return hostel;
};

module.exports = { findById, findAll, create, updateById, deleteById };
