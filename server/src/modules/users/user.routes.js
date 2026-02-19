const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorizeRoles, authorizeApprovedWarden } = require('../../shared/middleware/role.middleware');
const { privateRateLimiter } = require('../../shared/middleware/rateLimit.middleware');
const { ROLES } = require('../../shared/constants');

router.use(authenticate);
router.use(privateRateLimiter);
router.use(authorizeRoles(ROLES.ADMIN, ROLES.WARDEN));
router.use(authorizeApprovedWarden);

router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);
router.post('/', authorizeRoles(ROLES.ADMIN), userController.createUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', authorizeRoles(ROLES.ADMIN), userController.deleteUser);
router.patch('/:id/approve', authorizeRoles(ROLES.ADMIN), userController.approveWarden);
router.patch('/:id/reject', authorizeRoles(ROLES.ADMIN), userController.rejectWarden);

module.exports = router;
