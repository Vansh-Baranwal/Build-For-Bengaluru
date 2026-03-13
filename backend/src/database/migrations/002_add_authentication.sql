-- Add authentication fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS role VARCHAR(20) CHECK (role IN ('citizen', 'government', 'news'));

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on role for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update comment
COMMENT ON COLUMN users.role IS 'User role: citizen, government, or news';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
