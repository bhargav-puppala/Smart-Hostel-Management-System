const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../logger');
const env = require('../../config/env');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      error = ApiError.badRequest(err.message || 'Validation failed', errors);
    } else if (err.code === 'LIMIT_FILE_SIZE') {
      error = ApiError.badRequest('File too large. Max 5MB allowed.');
    } else if (err.message?.includes('Only images')) {
      error = ApiError.badRequest(err.message);
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      error = ApiError.conflict(`${field} already exists`);
    } else {
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal server error';
      error = new ApiError(statusCode, message);
    }
  }

  const { statusCode, message, errors } = error;

  if (statusCode >= 500) {
    logger.error('Server Error:', { message, stack: err.stack });
  } else {
    logger.warn('Client Error:', message);
  }

  const response = {
    success: false,
    message,
    ...(errors?.length && { errors }),
  };

  if (env.NODE_ENV === 'development' && statusCode >= 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
