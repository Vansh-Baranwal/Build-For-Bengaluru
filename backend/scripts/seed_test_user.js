const bcrypt = require('bcryptjs');
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedTestUser() {
  const email = 'testuser@example.com';
  const password = 'test123456';
  const name = 'Test User';
  const role = 'citizen';

  try {
    await client.connect();
    
    // Check if user exists
    const checkRes = await client.query('SELECT user_id FROM public.users WHERE email = $1', [email]);
    
    const password_hash = await bcrypt.hash(password, 10);
    
    if (checkRes.rows.length > 0) {
      console.log(`Updating existing user: ${email}`);
      await client.query(
        'UPDATE public.users SET password_hash = $1, role = $2, name = $3 WHERE email = $4',
        [password_hash, role, name, email]
      );
    } else {
      console.log(`Creating new user: ${email}`);
      await client.query(
        'INSERT INTO public.users (name, email, password_hash, role, reputation_score) VALUES ($1, $2, $3, $4, 50)',
        [name, email, password_hash, role]
      );
    }
    
    console.log('✅ Test user seeded successfully');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
  } catch (err) {
    console.error('❌ Error seeding user:', err);
  } finally {
    await client.end();
  }
}

seedTestUser();
