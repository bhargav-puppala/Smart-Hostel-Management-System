const express = require('express');
const router = express.Router();
const statsController = require('./stats.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorizeRoles } = require('../../shared/middleware/role.middleware');
const { ROLES } = require('../../shared/constants');

router.get('/', authenticate, authorizeRoles(ROLES.ADMIN, ROLES.WARDEN, ROLES.ACCOUNTANT), statsController.getStats);

module.exports = router;
