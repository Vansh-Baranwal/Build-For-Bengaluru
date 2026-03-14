const { Pool } = require('pg');
require('dotenv').config();
const escalationService = require('./src/services/escalationService');
const db = require('./src/database/db');

async function testFullEscalationFlow() {
  try {
    console.log('--- Testing Full Escalation & Email Flow ---');
    
    // 1. Setup a dummy complaint
    // We need to use the db module to ensure it's the same connection pool if possible,
    // but the test script usually runs standalone.
    
    const insertQuery = `
      INSERT INTO complaints (
        user_id, category, department_group, description, status, deadline, location
      ) VALUES (
        (SELECT user_id FROM users LIMIT 1),
        'Cleaning Work',
        'Cleaning Work',
        'Email Escalation Test',
        'in_progress',
        NOW() - INTERVAL '1 hour',
        ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)
      ) RETURNING complaint_id;
    `;
    
    const res = await db.query(insertQuery);
    const complaintId = res.rows[0].complaint_id;
    console.log(`✅ Created overdue complaint for email test: ${complaintId}`);

    // 2. Trigger the Service Logic
    console.log('🚀 Triggering Service Escalation Scan...');
    await escalationService.checkEscalations();

    // 3. Verify DB Update
    const verifyRes = await db.query('SELECT is_escalated FROM complaints WHERE complaint_id = $1', [complaintId]);
    if (verifyRes.rows[0].is_escalated) {
      console.log('🔥 SUCCESS: Database record marked as escalated.');
      console.log('📧 Check logs for "Escalation Email Triggered" message.');
    } else {
      console.error('❌ FAILURE: Database record was NOT updated.');
    }

    // 4. Cleanup
    await db.query('DELETE FROM complaints WHERE complaint_id = $1', [complaintId]);
    console.log('✅ Cleanup completed.');

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    process.exit(0);
  }
}

testFullEscalationFlow();
