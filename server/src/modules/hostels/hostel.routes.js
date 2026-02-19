const express = require('express');
const router = express.Router();
const hostelController = require('./hostel.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorizeRoles, authorizeApprovedWarden } = require('../../shared/middleware/role.middleware');
const { privateRateLimiter } = require('../../shared/middleware/rateLimit.middleware');
const { ROLES } = require('../../shared/constants');

router.use(authenticate);
router.use(privateRateLimiter);
router.use(authorizeRoles(ROLES.ADMIN, ROLES.WARDEN));
router.use(authorizeApprovedWarden);

router.get('/', hostelController.getHostels);
router.get('/:id', hostelController.getHostel);
router.post('/', authorizeRoles(ROLES.ADMIN), hostelController.createHostel);
router.patch('/:id', hostelController.updateHostel);
router.delete('/:id', authorizeRoles(ROLES.ADMIN), hostelController.deleteHostel);

module.exports = router;
