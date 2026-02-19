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

/** Blocks pending wardens from data routes. Allows admin, accountant, students, and approved wardens. */
const authorizeApprovedWarden = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required.'));
  }
  const { role, approvalStatus } = req.user;
  if (role === ROLES.WARDEN && approvalStatus !== 'approved') {
    return next(ApiError.forbidden('Your account is pending admin approval. You will have full access once approved.'));
  }
  return next();
};

const isAdmin = authorizeRoles(ROLES.ADMIN);
const isWarden = authorizeRoles(ROLES.ADMIN, ROLES.WARDEN);
const isAccountant = authorizeRoles(ROLES.ADMIN, ROLES.ACCOUNTANT);
const isStudent = authorizeRoles(ROLES.STUDENT);

module.exports = {
  authorizeRoles,
  authorizeApprovedWarden,
  isAdmin,
  isWarden,
  isAccountant,
  isStudent,
};
