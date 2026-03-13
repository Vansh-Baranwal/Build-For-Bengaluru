const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runAuthMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Running authentication migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../src/database/migrations/002_add_authentication.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await pool.query(migrationSQL);
    
    console.log('✅ Authentication migration completed successfully');
    console.log('');
    console.log('Users table now has:');
    console.log('  - role (VARCHAR) - citizen, government, or news');
    console.log('  - password_hash (TEXT) - bcrypt hashed passwords');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runAuthMigration();
