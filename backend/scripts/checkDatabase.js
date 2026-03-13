const { Pool } = require('pg');
require('dotenv').config();

async function checkDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    
    // Check PostGIS
    const postgisCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'postgis'
      ) as postgis_enabled
    `);
    
    console.log('PostGIS enabled:', postgisCheck.rows[0].postgis_enabled);
    
    // Check existing tables
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('\nExisting tables:');
    if (tablesCheck.rows.length === 0) {
      console.log('  (none)');
    } else {
      tablesCheck.rows.forEach(row => {
        console.log('  -', row.table_name);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
