const express = require('express');
const router = express.Router();
const visitorController = require('./visitor.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorizeRoles, authorizeApprovedWarden } = require('../../shared/middleware/role.middleware');
const { privateRateLimiter } = require('../../shared/middleware/rateLimit.middleware');
const { ROLES } = require('../../shared/constants');

router.use(authenticate);
router.use(privateRateLimiter);
router.use(authorizeApprovedWarden);

router.get('/', visitorController.getVisitors);
router.get('/:id', visitorController.getVisitor);
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN, ROLES.STUDENT), visitorController.createVisitor);
router.patch('/:id/checkout', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN), visitorController.checkOutVisitor);

module.exports = router;
