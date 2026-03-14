const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateFeedback() {
  const client = await pool.connect();
  try {
    console.log('--- Feedback Migration Starting ---');
    
    // 1. Add feedback_rating column
    await client.query(`
      ALTER TABLE public.complaints 
      ADD COLUMN IF NOT EXISTS feedback_rating INTEGER;
    `);
    console.log('✅ Added feedback_rating column');

    // 2. Add feedback_comments column
    await client.query(`
      ALTER TABLE public.complaints 
      ADD COLUMN IF NOT EXISTS feedback_comments TEXT;
    `);
    console.log('✅ Added feedback_comments column');

    console.log('--- Feedback Migration Completed Successfully ---');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateFeedback();
