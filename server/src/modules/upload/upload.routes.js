const express = require('express');
const router = express.Router();
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorizeApprovedWarden } = require('../../shared/middleware/role.middleware');
const { privateRateLimiter } = require('../../shared/middleware/rateLimit.middleware');
const { uploadSingle, useCloudinary } = require('../../shared/middleware/upload.middleware');
const ApiResponse = require('../../shared/utils/ApiResponse');
const ApiError = require('../../shared/utils/ApiError');

router.post('/', authenticate, privateRateLimiter, authorizeApprovedWarden, uploadSingle('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('No image file provided');
    }

    let url;
    let filename;

    if (useCloudinary) {
      const cloudinary = require('../../config/cloudinary');
      const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'hostlr',
        resource_type: 'image',
      });
      url = result.secure_url;
      filename = result.public_id;
    } else {
      url = `/uploads/${req.file.filename}`;
      filename = req.file.filename;
    }

    return ApiResponse.success(res, { url, filename });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
