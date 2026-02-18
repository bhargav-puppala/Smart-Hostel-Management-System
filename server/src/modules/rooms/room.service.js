const roomRepository = require('./room.repository');
const ApiError = require('../../shared/utils/ApiError');
const Room = require('./room.model');
const { ROOM_STATUS } = require('../../shared/constants');

const getById = (id) => roomRepository.findById(id);
const getAll = (filter, options) => roomRepository.findAll(filter, options);
const createRoom = (data) => roomRepository.create(data);
const updateRoom = (id, data) => roomRepository.updateById(id, data);
const deleteRoom = (id) => roomRepository.deleteById(id);

const updateRoomStatus = async (roomId) => {
  const room = await Room.findById(roomId);
  if (!room) throw ApiError.notFound('Room not found');
  const occupantCount = room.occupants?.length || 0;
  let status = ROOM_STATUS.AVAILABLE;
  if (room.status === ROOM_STATUS.MAINTENANCE) status = ROOM_STATUS.MAINTENANCE;
  else if (occupantCount >= room.capacity) status = ROOM_STATUS.FULL;
  else if (occupantCount > 0) status = ROOM_STATUS.AVAILABLE;
  room.status = status;
  await room.save();
  return room;
};

module.exports = { getById, getAll, createRoom, updateRoom, deleteRoom, updateRoomStatus };
