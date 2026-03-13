const { Pool } = require('pg');
require('dotenv').config();

async function checkSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query(`
      SELECT table_schema, table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY table_schema, column_name;
    `);
    console.log("Users tables:");
    res.rows.forEach(r => console.log(`[${r.table_schema}] ${r.table_name}.${r.column_name} (${r.data_type})`));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkSchema();
