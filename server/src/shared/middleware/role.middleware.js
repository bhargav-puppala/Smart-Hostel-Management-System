const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return next(ApiError.forbidden('You do not have permission to perform this action.'));
    }

    next();
  };
};

const isAdmin = authorizeRoles(ROLES.ADMIN);
const isWarden = authorizeRoles(ROLES.ADMIN, ROLES.WARDEN);
const isAccountant = authorizeRoles(ROLES.ADMIN, ROLES.ACCOUNTANT);
const isStudent = authorizeRoles(ROLES.STUDENT);

module.exports = {
  authorizeRoles,
  isAdmin,
  isWarden,
  isAccountant,
  isStudent,
};
