const { Pool } = require('pg');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // 1. Drop foreign key in complaints
    await pool.query('ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_user_id_fkey');
    console.log('Dropped foreign key from complaints');

    // 2. Rename the column
    await pool.query('ALTER TABLE users RENAME COLUMN id TO user_id');
    console.log('Renamed id to user_id in users table');

    // 3. Re-add foreign key
    await pool.query('ALTER TABLE complaints ADD CONSTRAINT complaints_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id)');
    console.log('Re-added foreign key to complaints');

  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    pool.end();
  }
}

runMigration();
