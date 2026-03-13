const pinoHttp = require('pino-http');
const logger = require('../config/logger');

/**
 * HTTP request logging middleware using pino-http
 * Logs all incoming requests with metadata
 */
const requestLogger = pinoHttp({
  logger: logger,
  
  // Custom log message
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) {
      return 'error';
    } else if (res.statusCode >= 400) {
      return 'warn';
    } else if (res.statusCode >= 300) {
      return 'info';
    }
    return 'info';
  },

  // Custom success message
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} completed`;
  },

  // Custom error message
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} failed: ${err.message}`;
  },

  // Custom attribute keys
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'duration'
  },

  // Serialize request and response
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      path: req.path,
      parameters: req.params,
      query: req.query,
      remoteAddress: req.ip,
      remotePort: req.socket?.remotePort
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  }
});

module.exports = requestLogger;
