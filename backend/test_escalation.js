const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testEscalation() {
  const client = await pool.connect();
  try {
    console.log('--- Testing Escalation Logic ---');
    
    // 1. Create a dummy overdue complaint
    const insertQuery = `
      INSERT INTO complaints (
        user_id, category, description, status, deadline, location
      ) VALUES (
        (SELECT user_id FROM users LIMIT 1),
        'Cleaning Work',
        'Overdue Test Complaint',
        'in_progress',
        NOW() - INTERVAL '1 day',
        ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)
      ) RETURNING complaint_id;
    `;
    
    const res = await client.query(insertQuery);
    const complaintId = res.rows[0].complaint_id;
    console.log(`✅ Created overdue complaint: ${complaintId}`);

    // 2. Run the escalation logic (manually triggering what the cron would do)
    const updateQuery = `
      UPDATE public.complaints
      SET is_escalated = TRUE
      WHERE 
        status = 'in_progress' AND 
        deadline < NOW() AND
        is_escalated = FALSE
      RETURNING complaint_id;
    `;
    
    const updateRes = await client.query(updateQuery);
    if (updateRes.rows.some(r => r.complaint_id === complaintId)) {
      console.log(`🔥 SUCCESS: Complaint ${complaintId} was correctly escalated!`);
    } else {
      console.error(`❌ FAILURE: Complaint ${complaintId} was NOT escalated.`);
    }

    // 3. Cleanup
    await client.query('DELETE FROM complaints WHERE complaint_id = $1', [complaintId]);
    console.log('✅ Cleanup completed.');

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testEscalation();
