const logger = require('../config/logger');

/**
 * Role-based access control middleware
 * Restricts access based on user role
 * 
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
function requireRole(allowedRoles) {
  // Convert single role to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user || !req.user.role) {
      logger.warn('Role check failed: No user in request');
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'Authentication required'
      });
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      logger.warn(
        { user_role: req.user.role, required_roles: roles },
        'Role check failed: Insufficient permissions'
      );
      return res.status(403).json({
        error: 'Forbidden',
        details: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    logger.debug({ user_role: req.user.role }, 'Role check passed');
    next();
  };
}

module.exports = requireRole;
