const express = require('express');
const router = express.Router();
const complaintController = require('./complaint.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorizeRoles, authorizeApprovedWarden } = require('../../shared/middleware/role.middleware');
const { privateRateLimiter } = require('../../shared/middleware/rateLimit.middleware');
const { ROLES } = require('../../shared/constants');

router.use(authenticate);
router.use(privateRateLimiter);
router.use(authorizeApprovedWarden);

router.get('/', complaintController.getComplaints);
router.get('/:id', complaintController.getComplaint);
router.post('/', complaintController.createComplaint);
router.patch('/:id/resolve', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN), complaintController.resolveComplaint);
router.patch('/:id/status', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN), complaintController.updateComplaintStatus);

module.exports = router;
