require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => client.query(`
      SELECT 
        complaint_id,
        category,
        priority,
        status,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude,
        created_at,
        updated_at
      FROM complaints
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, ['00000000-0000-0000-0000-000000000000']))
  .then(res => console.log('✅ ROW COUNT:', res.rowCount))
  .catch(e => {
     console.error('❌ SQL ERROR MESSAGE:', e.message);
     console.error('❌ POSITION:', e.position);
  })
  .finally(() => client.end());
