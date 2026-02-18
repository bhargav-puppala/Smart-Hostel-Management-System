const allotmentRepository = require('./allotment.repository');
const Allotment = require('./allotment.model');
const Room = require('../rooms/room.model');
const User = require('../users/user.model');
const ApiError = require('../../shared/utils/ApiError');
const roomService = require('../rooms/room.service');
const logger = require('../../shared/logger');

const getById = (id) => allotmentRepository.findById(id);
const getAll = (filter, options) => allotmentRepository.findAll(filter, options);

const createAllotment = async (data) => {
  const { studentId, roomId } = data;
  const room = await Room.findById(roomId);
  if (!room) throw ApiError.notFound('Room not found');
  if (room.status === 'full') throw ApiError.badRequest('Room is full');
  if (room.occupants?.length >= room.capacity) throw ApiError.badRequest('Room capacity reached');

  const activeAllotment = await Allotment.findOne({ studentId, endDate: null });
  if (activeAllotment) throw ApiError.badRequest('Student already has an active room allotment');

  const user = await User.findById(studentId);
  if (!user) throw ApiError.notFound('Student not found');
  if (user.role !== 'student') throw ApiError.badRequest('Only students can be allotted rooms');

  const allotment = await allotmentRepository.create(data);
  room.occupants.push(studentId);
  await room.save();
  user.hostelId = room.hostelId;
  await user.save();

  await roomService.updateRoomStatus(roomId);

  logger.info('Room allotment created', { allotmentId: allotment._id, studentId, roomId });
  return allotmentRepository.findById(allotment._id);
};

const endAllotment = async (id) => {
  const allotment = await allotmentRepository.findById(id);
  if (allotment.endDate) throw ApiError.badRequest('Allotment already ended');

  const roomId = allotment.roomId?._id ?? allotment.roomId;
  const studentId = allotment.studentId?._id ?? allotment.studentId;

  const room = await Room.findById(roomId);
  if (room) {
    room.occupants = room.occupants.filter((o) => o.toString() !== studentId.toString());
    await room.save();
    await roomService.updateRoomStatus(room._id);
  }

  const user = await User.findById(studentId);
  if (user) {
    user.hostelId = null;
    await user.save();
  }

  return allotmentRepository.updateById(id, { endDate: new Date() });
};

module.exports = { getById, getAll, createAllotment, endAllotment };
