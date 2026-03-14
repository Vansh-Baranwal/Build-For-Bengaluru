const db = require('./src/database/db');
const crypto = require('crypto');

async function seed() {
  try {
    // 1. Find a test citizen user
    const userRes = await db.query("SELECT user_id, email FROM users WHERE role = 'citizen' LIMIT 2");
    if (userRes.rows.length < 2) {
      console.log('Not enough users. Need at least 2 citizen users for validation test.');
      process.exit(0);
    }
    
    const citizen1 = userRes.rows[0];
    const citizen2 = userRes.rows[1];
    
    // Set a fixed location for testing (Bengaluru MG Road area approx)
    const lat = 12.9750;
    const lng = 77.5950;
    
    console.log(`Setting Citizen 1 (${citizen1.email}) location to ${lat}, ${lng}`);
    await db.query(`
      UPDATE users 
      SET last_location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      WHERE user_id = $3
    `, [lng, lat, citizen1.user_id]);

    // Create a complaint for citizen2 VERY close to citizen1 (e.g. 100 meters away)
    const closeLat = lat + 0.0001;
    const closeLng = lng + 0.0001;
    
    const complaintId = crypto.randomUUID();
    console.log(`Creating neighbor complaint for Citizen 2 (${citizen2.email}) at ${closeLat}, ${closeLng}`);
    await db.query(`
      INSERT INTO complaints (
        complaint_id, user_id, description, category, priority, status, location, department_group, issue_type
      )
      VALUES (
        $1, $2, $3, $4, $5, 'pending', 
        ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography,
        'Cleaning Work', 'Regular Problem'
      )
    `, [complaintId, citizen2.user_id, 'NEIGHBOR TEST: Pothole right here!', 'pothole', 'high', closeLng, closeLat]);

    console.log('✅ Seeding complete. Citizen 1 should now see Citizen 2\'s complaint in their nearby tasks.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();
