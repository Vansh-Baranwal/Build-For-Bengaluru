const { Pool } = require('pg');
require('dotenv').config();

async function fixMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check if user_id column exists now
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    console.log("Users table columns:", res.rows.map(r => r.column_name));

    // Wait, the previous error was probably because the foreign key creation referenced `users(id)` before, we used `users(user_id)` but maybe it's not the primary key?
    // Let's just check the state of the database constraints.
    const fkCheck = await pool.query(`
      SELECT
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='complaints';
    `);
    
    console.log("Foreign keys on complaints:", fkCheck.rows);
    
    // Check if user_id is properly indexed for FK
    try {
      await pool.query('ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);');
      console.log('Added primary key');
    } catch(e) { console.log('PK exists or another error:', e.message); }

    try {
      await pool.query('ALTER TABLE users ADD CONSTRAINT users_user_id_key UNIQUE (user_id);');
      console.log('Added unique constraint to user_id');
    } catch(e) { console.log('UNIQUE constraint exists or error:', e.message); }

    // Try adding the foreign key again
    await pool.query('ALTER TABLE complaints ADD CONSTRAINT complaints_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id)');
    console.log('Re-added foreign key to complaints successfully');

  } catch (err) {
    console.error('Fix Migration failed:', err.message);
  } finally {
    pool.end();
  }
}

fixMigration();
