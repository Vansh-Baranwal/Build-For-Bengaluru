require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
  try {
    await client.connect();
    const res = await client.query('SELECT user_id, email, role, (password_hash IS NOT NULL) as has_password FROM public.users LIMIT 10');
    console.log('USERS_JSON_START');
    console.log(JSON.stringify(res.rows, null, 2));
    console.log('USERS_JSON_END');
  } catch (err) {
    console.error('Error checking users:', err);
  } finally {
    await client.end();
  }
}

checkUsers();
