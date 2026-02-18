const express = require('express');
const router = express.Router();
const allotmentController = require('./allotment.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorizeRoles } = require('../../shared/middleware/role.middleware');
const { ROLES } = require('../../shared/constants');

router.use(authenticate);

router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN, ROLES.STUDENT), allotmentController.getAllotments);
router.get('/:id', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN, ROLES.STUDENT), allotmentController.getAllotment);
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN), allotmentController.createAllotment);
router.patch('/:id/end', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN), allotmentController.endAllotment);

module.exports = router;
