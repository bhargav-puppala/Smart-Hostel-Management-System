const userRepository = require('./user.repository');
const ApiError = require('../../shared/utils/ApiError');
const { ROLES } = require('../../shared/constants');

const getById = async (id) => {
  return userRepository.findById(id);
};

const getAll = async (filter = {}, options = {}) => {
  return userRepository.findAll(filter, options);
};

const createUser = async (data) => {
  const existing = await userRepository.findByEmail(data.email);
  if (existing) throw ApiError.conflict('Email already registered');
  const user = await userRepository.create(data);
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  return userObj;
};

const updateUser = async (id, data) => {
  if (data.email) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing && existing._id.toString() !== id) {
      throw ApiError.conflict('Email already in use');
    }
  }
  return userRepository.updateById(id, data);
};

const deleteUser = async (id) => {
  return userRepository.deleteById(id);
};

const approveWarden = async (id) => {
  const user = await userRepository.findById(id);
  if (user.role !== ROLES.WARDEN) throw ApiError.badRequest('Only wardens can be approved');
  if (user.approvalStatus === 'approved') throw ApiError.badRequest('Warden is already approved');
  return userRepository.updateById(id, { approvalStatus: 'approved', isActive: true });
};

const rejectWarden = async (id) => {
  const user = await userRepository.findById(id);
  if (user.role !== ROLES.WARDEN) throw ApiError.badRequest('Only wardens can be rejected');
  return userRepository.updateById(id, { approvalStatus: 'rejected' });
};

module.exports = {
  getById,
  getAll,
  createUser,
  updateUser,
  deleteUser,
  approveWarden,
  rejectWarden,
};
