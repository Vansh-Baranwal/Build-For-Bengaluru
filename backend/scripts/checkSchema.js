const { Pool } = require('pg');
require('dotenv').config();

async function checkSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    console.log("Users table columns:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkSchema();
