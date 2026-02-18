const User = require('./user.model');
const ApiError = require('../../shared/utils/ApiError');
const parsePagination = require('../../shared/utils/parsePagination');

const findById = async (id) => {
  const user = await User.findById(id).select('-password').populate('hostelId', 'name address');
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const findByEmail = async (email) => {
  return User.findOne({ email: email.toLowerCase() });
};

const findAll = async (filter = {}, options = {}) => {
  const { page, limit } = parsePagination(options);
  const { sort = '-createdAt' } = options;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').populate('hostelId', 'name address').sort(sort).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const create = async (data) => {
  return User.create(data);
};

const updateById = async (id, data) => {
  const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .select('-password')
    .populate('hostelId', 'name address');
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const deleteById = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

module.exports = {
  findById,
  findByEmail,
  findAll,
  create,
  updateById,
  deleteById,
};
