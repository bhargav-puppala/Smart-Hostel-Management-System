const Room = require('./room.model');
const ApiError = require('../../shared/utils/ApiError');
const parsePagination = require('../../shared/utils/parsePagination');

const findById = async (id) => {
  const room = await Room.findById(id).populate('hostelId', 'name address').populate('occupants', 'name email');
  if (!room) throw ApiError.notFound('Room not found');
  return room;
};

const findAll = async (filter = {}, options = {}) => {
  const { page, limit } = parsePagination(options);
  const { sort = 'roomNumber' } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Room.find(filter).populate('hostelId', 'name address').sort(sort).skip(skip).limit(limit).lean(),
    Room.countDocuments(filter),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const create = async (data) => Room.create(data);

const updateById = async (id, data) => {
  const room = await Room.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('hostelId', 'name address')
    .populate('occupants', 'name email');
  if (!room) throw ApiError.notFound('Room not found');
  return room;
};

const deleteById = async (id) => {
  const room = await Room.findByIdAndDelete(id);
  if (!room) throw ApiError.notFound('Room not found');
  return room;
};

module.exports = { findById, findAll, create, updateById, deleteById };
