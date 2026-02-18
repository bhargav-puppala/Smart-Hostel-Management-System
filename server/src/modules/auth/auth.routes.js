const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, authController.updateProfile);

module.exports = router;
