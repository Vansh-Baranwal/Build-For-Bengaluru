const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyFeedbackIntegration() {
  const client = await pool.connect();
  try {
    console.log('--- Verification Starting ---');
    
    // 1. Check columns
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'complaints' 
      AND column_name IN ('feedback_rating', 'feedback_comments');
    `);
    
    console.log('Database Columns:', res.rows);
    if (res.rows.length === 2) {
      console.log('✅ Database columns verified');
    } else {
      console.log('❌ Database columns missing');
    }

    // 2. Try to find a resolved complaint to test (optional, just query for status)
    const statusRes = await client.query("SELECT COUNT(*) FROM complaints WHERE status = 'resolved'");
    console.log('Resolved complaints count:', statusRes.rows[0].count);

  } catch (err) {
    console.error('❌ Verification failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyFeedbackIntegration();
