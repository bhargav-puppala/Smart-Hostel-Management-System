const Announcement = require('./announcement.model');
const ApiResponse = require('../../shared/utils/ApiResponse');
const ApiError = require('../../shared/utils/ApiError');

const getAnnouncements = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, hostelId } = req.query;
    const filter = {};
    if (hostelId) filter.hostelId = hostelId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [data, total] = await Promise.all([
      Announcement.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('createdBy', 'name')
        .populate('hostelId', 'name')
        .lean(),
      Announcement.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / parseInt(limit, 10));
    return ApiResponse.paginated(res, data, { page: parseInt(page, 10), limit: parseInt(limit, 10), total, totalPages });
  } catch (error) {
    next(error);
  }
};

const getAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('hostelId', 'name');
    if (!announcement) throw ApiError.notFound('Announcement not found');
    return ApiResponse.success(res, announcement);
  } catch (error) {
    next(error);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    const announcement = await Announcement.create(data);
    const populated = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name')
      .populate('hostelId', 'name');
    return ApiResponse.created(res, populated);
  } catch (error) {
    next(error);
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name')
      .populate('hostelId', 'name');
    if (!announcement) throw ApiError.notFound('Announcement not found');
    return ApiResponse.success(res, announcement, 'Announcement updated');
  } catch (error) {
    next(error);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) throw ApiError.notFound('Announcement not found');
    return ApiResponse.success(res, null, 'Announcement deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
