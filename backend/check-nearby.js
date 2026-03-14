const db = require('./src/database/db');

async function checkNearby() {
  try {
    // 1. Get all users with locations
    const users = await db.query("SELECT user_id, email, ST_AsText(last_location) as loc FROM users WHERE last_location IS NOT NULL");
    console.log(`Found ${users.rows.length} users with locations.`);

    for (const user of users.rows) {
        console.log(`\nChecking for user: ${user.email} (${user.user_id}) at ${user.loc}`);
        
        const nearbyQuery = `
          SELECT 
            c.complaint_id, 
            c.description, 
            ST_AsText(c.location) as complaint_loc,
            ST_Distance(c.location, (SELECT last_location FROM users WHERE user_id = $1)) as distance
          FROM complaints c
          LEFT JOIN complaint_verifications v ON c.complaint_id = v.complaint_id AND v.user_id = $1
          WHERE c.status = 'pending'
            AND c.user_id != $1
            AND v.id IS NULL
            AND ST_DWithin(c.location, (SELECT last_location FROM users WHERE user_id = $1), 5000)
          ORDER BY distance ASC
        `;
        
        const result = await db.query(nearbyQuery, [user.user_id]);
        console.log(`Found ${result.rows.length} nearby complaints.`);
        result.rows.forEach(r => {
            console.log(` - ${r.complaint_id}: ${r.description} at ${r.complaint_loc} (Dist: ${Math.round(r.distance)}m)`);
        });
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkNearby();
