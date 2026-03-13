require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'complaints'"))
  .then(res => console.log('COLUMNS:', res.rows.map(r => r.column_name)))
  .catch(e => console.error(e))
  .finally(() => client.end());
