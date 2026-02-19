const express = require('express');
const router = express.Router();
const path = require('path');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorizeApprovedWarden } = require('../../shared/middleware/role.middleware');
const { privateRateLimiter } = require('../../shared/middleware/rateLimit.middleware');
const { uploadSingle } = require('../../shared/middleware/upload.middleware');
const ApiResponse = require('../../shared/utils/ApiResponse');
const ApiError = require('../../shared/utils/ApiError');

router.post('/', authenticate, privateRateLimiter, authorizeApprovedWarden, uploadSingle('image'), (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('No image file provided');
    }
    const url = `/uploads/${req.file.filename}`;
    return ApiResponse.success(res, { url, filename: req.file.filename });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
