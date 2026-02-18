const roomService = require('./room.service');
const ApiResponse = require('../../shared/utils/ApiResponse');

const getRooms = async (req, res, next) => {
  try {
    const { page, limit, hostelId, status } = req.query;
    const filter = {};
    if (hostelId) filter.hostelId = hostelId;
    if (status) filter.status = status;

    const result = await roomService.getAll(filter, { page, limit });
    return ApiResponse.paginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getRoom = async (req, res, next) => {
  try {
    const room = await roomService.getById(req.params.id);
    return ApiResponse.success(res, room);
  } catch (error) {
    next(error);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const room = await roomService.createRoom(req.body);
    return ApiResponse.created(res, room);
  } catch (error) {
    next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const room = await roomService.updateRoom(req.params.id, req.body);
    return ApiResponse.success(res, room, 'Room updated');
  } catch (error) {
    next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    await roomService.deleteRoom(req.params.id);
    return ApiResponse.success(res, null, 'Room deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { getRooms, getRoom, createRoom, updateRoom, deleteRoom };
