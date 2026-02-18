const express = require('express');
const router = express.Router();
const feeController = require('./fee.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorizeRoles } = require('../../shared/middleware/role.middleware');
const { ROLES } = require('../../shared/constants');

router.use(authenticate);

router.get('/', feeController.getFees);
router.get('/:id', feeController.getFee);
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.ACCOUNTANT), feeController.createFee);
router.patch('/:id/pay', authorizeRoles(ROLES.ADMIN, ROLES.ACCOUNTANT), feeController.payFee);

module.exports = router;
