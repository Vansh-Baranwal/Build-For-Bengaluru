const pino = require('pino');
const config = require('./env');

/**
 * Configure Pino logger based on environment
 */
const logger = pino({
  level: config.server.nodeEnv === 'production' ? 'info' : 'debug',
  
  // Pretty print in development for better readability
  transport: config.server.nodeEnv === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: false
    }
  } : undefined,

  // Base configuration
  base: {
    env: config.server.nodeEnv
  },

  // Redact sensitive information
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-api-key"]',
      'password',
      'apiKey',
      'token',
      'secret'
    ],
    censor: '[REDACTED]'
  },

  // Serializers for common objects
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      path: req.path,
      parameters: req.params,
      query: req.query,
      // Don't log request body in production for security
      body: config.server.nodeEnv === 'development' ? req.body : undefined
    }),
    res: (res) => ({
      statusCode: res.statusCode
    }),
    err: pino.stdSerializers.err
  }
});

/**
 * Log levels:
 * - trace: Very detailed debugging information
 * - debug: Debugging information
 * - info: General informational messages
 * - warn: Warning messages
 * - error: Error messages
 * - fatal: Fatal errors that cause application to crash
 */

module.exports = logger;
