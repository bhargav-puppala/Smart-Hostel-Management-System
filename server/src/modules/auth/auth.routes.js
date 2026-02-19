const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { privateRateLimiter } = require('../../shared/middleware/rateLimit.middleware');

// Public routes - no rate limit
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);

// Private routes - rate limit by user ID
router.get('/me', authenticate, privateRateLimiter, authController.getMe);
router.patch('/me', authenticate, privateRateLimiter, authController.updateProfile);

module.exports = router;
