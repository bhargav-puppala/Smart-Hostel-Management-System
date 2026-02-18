const express = require('express');
const router = express.Router();
const roomController = require('./room.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorizeRoles } = require('../../shared/middleware/role.middleware');
const { ROLES } = require('../../shared/constants');

router.use(authenticate);
router.use(authorizeRoles(ROLES.ADMIN, ROLES.WARDEN, ROLES.STUDENT));

router.get('/', roomController.getRooms);
router.get('/:id', roomController.getRoom);
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN), roomController.createRoom);
router.patch('/:id', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN), roomController.updateRoom);
router.delete('/:id', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN), roomController.deleteRoom);

module.exports = router;
