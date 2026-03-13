const express = require('express');
const config = require('./config/env');
const logger = require('./config/logger');
const requestLogger = require('./middlewares/requestLogger');
const db = require('./database/db');
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

/**
 * Middleware setup
 */
const cors = require('cors');

// CORS Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://build-for-bengaluru.vercel.app'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json({ limit: '25mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// HTTP request logging
app.use(requestLogger);

/**
 * Health check endpoint
 * GET /health
 */
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await db.checkConnection();
    
    if (dbStatus.connected) {
      res.status(200).json({
        status: 'ok',
        database: 'connected',
        postgis: dbStatus.postgis ? 'enabled' : 'disabled',
        timestamp: dbStatus.timestamp
      });
    } else {
      res.status(503).json({
        status: 'error',
        database: 'disconnected',
        error: dbStatus.error
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});

/**
 * API routes
 */
app.use('/api/auth', authRoutes);
app.use('/api', complaintRoutes);

/**
 * 404 handler for undefined routes
 */
app.use(notFoundHandler);

/**
 * Error handler (must be last)
 */
app.use(errorHandler);

/**
 * Start server
 */
async function startServer() {
  try {
    // Verify database connection before starting server
    logger.info('Checking database connection...');
    const dbStatus = await db.checkConnection();
    
    if (!dbStatus.connected) {
      logger.error({ error: dbStatus.error }, 'Failed to connect to database');
      process.exit(1);
    }
    
    logger.info('Database connected successfully');
    logger.info(`PostGIS ${dbStatus.postgis ? 'enabled' : 'disabled'}`);
    
    // Start HTTP server
    const PORT = config.server.port;
    app.listen(PORT, () => {
      logger.info({
        port: PORT,
        environment: config.server.nodeEnv,
        healthCheck: `http://localhost:${PORT}/health`,
        apiEndpoint: `http://localhost:${PORT}/api`
      }, 'NammaFix Backend started successfully');
    });
    
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await db.closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await db.closePool();
  process.exit(0);
});

// Start the server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
