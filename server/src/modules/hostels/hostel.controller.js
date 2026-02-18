const hostelService = require('./hostel.service');
const ApiResponse = require('../../shared/utils/ApiResponse');

const getHostels = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await hostelService.getAll({}, { page, limit });
    return ApiResponse.paginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getHostel = async (req, res, next) => {
  try {
    const hostel = await hostelService.getById(req.params.id);
    return ApiResponse.success(res, hostel);
  } catch (error) {
    next(error);
  }
};

const createHostel = async (req, res, next) => {
  try {
    const hostel = await hostelService.createHostel(req.body);
    return ApiResponse.created(res, hostel);
  } catch (error) {
    next(error);
  }
};

const updateHostel = async (req, res, next) => {
  try {
    const hostel = await hostelService.updateHostel(req.params.id, req.body);
    return ApiResponse.success(res, hostel, 'Hostel updated');
  } catch (error) {
    next(error);
  }
};

const deleteHostel = async (req, res, next) => {
  try {
    await hostelService.deleteHostel(req.params.id);
    return ApiResponse.success(res, null, 'Hostel deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { getHostels, getHostel, createHostel, updateHostel, deleteHostel };
