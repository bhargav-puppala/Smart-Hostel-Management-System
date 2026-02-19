const express = require('express');
const router = express.Router();
const allotmentController = require('./allotment.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorizeRoles, authorizeApprovedWarden } = require('../../shared/middleware/role.middleware');
const { privateRateLimiter } = require('../../shared/middleware/rateLimit.middleware');
const { ROLES } = require('../../shared/constants');

router.use(authenticate);
router.use(privateRateLimiter);
router.use(authorizeApprovedWarden);

router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN, ROLES.STUDENT), allotmentController.getAllotments);
router.get('/:id', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN, ROLES.STUDENT), allotmentController.getAllotment);
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN), allotmentController.createAllotment);
router.patch('/:id/end', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN), allotmentController.endAllotment);

module.exports = router;
