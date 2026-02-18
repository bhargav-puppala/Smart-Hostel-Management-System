const express = require('express');
const router = express.Router();
const leaveController = require('./leave.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorizeRoles } = require('../../shared/middleware/role.middleware');
const { ROLES } = require('../../shared/constants');

router.use(authenticate);

router.get('/', leaveController.getLeaves);
router.get('/:id', leaveController.getLeave);
router.post('/', authorizeRoles(ROLES.STUDENT), leaveController.createLeave);
router.patch('/:id/approve', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN), leaveController.approveLeave);
router.patch('/:id/reject', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN), leaveController.rejectLeave);

module.exports = router;
