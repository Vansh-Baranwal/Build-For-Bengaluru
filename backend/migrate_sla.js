const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateSLA() {
  const client = await pool.connect();
  try {
    console.log('--- SLA Migration Starting ---');
    
    // 1. Add deadline column
    await client.query(`
      ALTER TABLE public.complaints 
      ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;
    `);
    console.log('✅ Added deadline column');

    // 2. Add is_escalated column
    await client.query(`
      ALTER TABLE public.complaints 
      ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT FALSE;
    `);
    console.log('✅ Added is_escalated column');

    console.log('--- SLA Migration Completed Successfully ---');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateSLA();
