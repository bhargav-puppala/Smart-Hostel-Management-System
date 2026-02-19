const express = require('express');
const router = express.Router();
const statsController = require('./stats.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorizeRoles, authorizeApprovedWarden } = require('../../shared/middleware/role.middleware');
const { privateRateLimiter } = require('../../shared/middleware/rateLimit.middleware');
const { ROLES } = require('../../shared/constants');

router.get('/', authenticate, privateRateLimiter, authorizeApprovedWarden, authorizeRoles(ROLES.ADMIN, ROLES.WARDEN, ROLES.ACCOUNTANT), statsController.getStats);

module.exports = router;
