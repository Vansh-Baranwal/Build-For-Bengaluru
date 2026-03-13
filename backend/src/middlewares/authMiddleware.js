const jwt = require('jsonwebtoken');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
function authMiddleware(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Attach user info to request
    req.user = {
      user_id: decoded.user_id,
      role: decoded.role,
      email: decoded.email
    };

    logger.debug({ user_id: decoded.user_id, role: decoded.role }, 'User authenticated');

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'Token expired'
      });
    }

    logger.error({ error }, 'Authentication error');

    return res.status(500).json({
      error: 'Internal server error',
      details: 'Authentication failed'
    });
  }
}

module.exports = authMiddleware;
