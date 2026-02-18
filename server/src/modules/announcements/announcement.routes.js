const express = require('express');
const router = express.Router();
const announcementController = require('./announcement.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const { authorizeRoles } = require('../../shared/middleware/role.middleware');
const { ROLES } = require('../../shared/constants');

router.use(authenticate);

router.get('/', announcementController.getAnnouncements);
router.get('/:id', announcementController.getAnnouncement);
router.post('/', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN), announcementController.createAnnouncement);
router.patch('/:id', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN), announcementController.updateAnnouncement);
router.delete('/:id', authorizeRoles(ROLES.ADMIN, ROLES.WARDEN), announcementController.deleteAnnouncement);

module.exports = router;
