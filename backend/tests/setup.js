/**
 * Jest setup file
 * Sets up test environment variables and global test configuration
 */

// Set up test environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.GROQ_API_KEY = 'test-groq-api-key';
process.env.PORT = '3001';
process.env.NODE_ENV = 'test';
