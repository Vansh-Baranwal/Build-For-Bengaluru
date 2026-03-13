const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../src/database/migrations/001_create_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Running migration: 001_create_schema.sql');
    
    // Execute migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Database schema created:');
    console.log('  - PostGIS extension enabled');
    console.log('  - Tables: users, complaints, clusters, assets');
    console.log('  - Spatial indexes created');
    console.log('  - Triggers configured');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
