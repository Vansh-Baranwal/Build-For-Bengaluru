const db = require('./src/database/db');
async function check() {
  try {
    const complaints = await db.query(`
      SELECT complaint_id, user_id, status, ST_AsText(location) as loc, category
      FROM complaints 
      WHERE status = 'pending'
    `);
    console.log('--- Pending Complaints ---');
    complaints.rows.forEach(r => console.log(`ID: ${r.complaint_id}, User: ${r.user_id}, Loc: ${r.loc}, Cat: ${r.category}`));

    const users = await db.query(`
      SELECT user_id, name, ST_AsText(last_location) as loc 
      FROM users 
      WHERE last_location IS NOT NULL
    `);
    console.log('--- Users with Locations ---');
    users.rows.forEach(r => console.log(`ID: ${r.user_id}, Name: ${r.name}, Loc: ${r.loc}`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
