const config = require('../config/env');
const logger = require('../config/logger');

/**
 * Custom error classes for different error types
 */

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class AIServiceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AIServiceError';
    this.statusCode = 500;
  }
}

class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
  }
}

/**
 * Centralized error handler middleware
 * Must be registered last in the middleware chain
 */
function errorHandler(err, req, res, next) {
  // Determine status code
  const statusCode = err.statusCode || 500;

  // Log error with structured logging
  const errorLog = {
    error: err.name || 'Error',
    message: err.message,
    statusCode: statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip
  };

  // Include stack trace in development
  if (config.server.nodeEnv === 'development') {
    errorLog.stack = err.stack;
  }

  // Log at appropriate level
  if (statusCode >= 500) {
    logger.error(errorLog, 'Server error occurred');
  } else if (statusCode >= 400) {
    logger.warn(errorLog, 'Client error occurred');
  }

  // Prepare response
  const response = {
    error: err.name || 'Internal server error',
    details: statusCode === 500 && config.server.nodeEnv === 'production'
      ? 'An unexpected error occurred' // Generic message in production
      : err.message
  };

  // Send error response
  res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler for undefined routes
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not Found',
    details: `Route ${req.method} ${req.path} not found`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  AIServiceError,
  DatabaseError
};
