require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => client.query(`
      ALTER TABLE complaints 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id);
      
      -- Let's also definitively make sure these ones exist
      ALTER TABLE complaints
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES clusters(cluster_id);
    `))
  .then(() => console.log('✅ SCHEMA MIGRATION SUCCESS!'))
  .catch(e => {
     console.error('❌ SQL ERROR:', e.message);
  })
  .finally(() => client.end());
