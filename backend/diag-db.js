const db = require('./src/database/db');
async function check() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'complaints' AND column_name = 'location'
    `);
    console.log('Complaints Location Type:', res.rows);

    const complaints = await db.query(`
      SELECT complaint_id, user_id, status, ST_AsText(location) as loc 
      FROM complaints 
      LIMIT 10
    `);
    console.log('Recent Complaints:', complaints.rows);

    const users = await db.query(`
      SELECT user_id, name, ST_AsText(last_location) as loc 
      FROM users 
      WHERE last_location IS NOT NULL
      LIMIT 10
    `);
    console.log('Users with Location:', users.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
