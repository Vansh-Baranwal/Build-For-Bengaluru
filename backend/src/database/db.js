const { Pool } = require('pg');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * PostgreSQL connection pool for Supabase database
 * Uses connection pooling for efficient database access
 */
const pool = new Pool({
  connectionString: config.database.url,
  ssl: {
    rejectUnauthorized: false // Required for Supabase connections
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

/**
 * Execute a parameterized query
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (config.server.nodeEnv === 'development') {
      logger.debug({ query: text, duration, rows: result.rowCount }, 'Database query executed');
    }
    
    return result;
  } catch (error) {
    logger.error({ error, query: text }, 'Database query error');
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * Remember to call client.release() when done
 * @returns {Promise<Object>} Database client
 */
async function getClient() {
  const client = await pool.connect();
  return client;
}

/**
 * Check database connectivity and PostGIS availability
 * @returns {Promise<Object>} Connection status
 */
async function checkConnection() {
  try {
    // Test basic connectivity
    const result = await query('SELECT NOW() as current_time');
    
    // Verify PostGIS extension is available
    const postgisCheck = await query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'postgis'
      ) as postgis_enabled
    `);
    
    const postgisEnabled = postgisCheck.rows[0].postgis_enabled;
    
    if (!postgisEnabled) {
      throw new Error('PostGIS extension is not enabled in the database');
    }
    
    return {
      connected: true,
      timestamp: result.rows[0].current_time,
      postgis: postgisEnabled
    };
  } catch (error) {
    logger.error({ error }, 'Database connection check failed');
    return {
      connected: false,
      error: error.message
    };
  }
}

/**
 * Gracefully close all database connections
 */
async function closePool() {
  await pool.end();
  logger.info('Database connection pool closed');
}

// Handle process termination
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

module.exports = {
  query,
  getClient,
  checkConnection,
  closePool
};
