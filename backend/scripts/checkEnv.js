require('dotenv').config();

console.log('Environment Variables Check:');
console.log('============================');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set (length: ' + process.env.DATABASE_URL.length + ')' : '✗ Missing');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✓ Set' : '✗ Missing');
console.log('');

if (process.env.DATABASE_URL) {
  // Show first 20 chars to verify format without exposing full credentials
  console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 20) + '...');
  
  // Check if it's a valid URL
  try {
    new URL(process.env.DATABASE_URL);
    console.log('✓ DATABASE_URL is a valid URL format');
  } catch (e) {
    console.log('✗ DATABASE_URL is NOT a valid URL format');
    console.log('Error:', e.message);
  }
}
