# NammaFix Backend Setup Guide

## Prerequisites

Before you begin, ensure you have:
- Node.js 16+ installed
- PostgreSQL database with PostGIS extension (via Supabase)
- Groq API key for AI processing
- Git (optional)

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and fill in your credentials:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# AI Service Configuration
GROQ_API_KEY=your-groq-api-key-here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Getting Your Credentials

**Supabase:**
1. Go to https://supabase.com
2. Create a new project or select existing one
3. Go to Project Settings > Database
4. Copy the connection string (DATABASE_URL)
5. Go to Project Settings > API
6. Copy the Project URL (SUPABASE_URL)
7. Copy the anon/public key (SUPABASE_ANON_KEY)

**Groq API:**
1. Go to https://console.groq.com
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (GROQ_API_KEY)

## Step 3: Enable PostGIS Extension

Connect to your Supabase database and run:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

You can do this in the Supabase SQL Editor:
1. Go to your Supabase project
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Paste the SQL above and click "Run"

## Step 4: Run Database Migrations

Execute the migration script to create tables and indexes:

```bash
# Option 1: Using Supabase SQL Editor
# Copy the contents of src/database/migrations/001_create_schema.sql
# Paste into Supabase SQL Editor and run

# Option 2: Using psql command line
psql $DATABASE_URL -f src/database/migrations/001_create_schema.sql
```

## Step 5: Verify Setup

Start the server:

```bash
npm run dev
```

You should see:
```
Checking database connection...
✓ Database connected
✓ PostGIS enabled

🚀 NammaFix Backend running on port 3000
   Environment: development
   Health check: http://localhost:3000/health
   API endpoint: http://localhost:3000/api
```

## Step 6: Test the API

### Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "postgis": "enabled",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Create a Test Complaint
```bash
curl -X POST http://localhost:3000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Large pothole on MG Road near Trinity Circle causing traffic issues",
    "latitude": 12.9716,
    "longitude": 77.5946
  }'
```

Expected response:
```json
{
  "complaint_id": "uuid-here",
  "category": "pothole",
  "priority": "high",
  "status": "pending"
}
```

## Step 7: Run Tests

```bash
npm test
```

This will run all unit and integration tests with coverage reporting.

## Troubleshooting

### Error: Missing required environment variables

**Problem:** Server fails to start with environment variable error.

**Solution:** Ensure all required variables are set in `.env` file:
- DATABASE_URL
- SUPABASE_URL
- SUPABASE_ANON_KEY
- GROQ_API_KEY

### Error: PostGIS extension is not enabled

**Problem:** Database connection fails with PostGIS error.

**Solution:** Run the PostGIS extension creation command in Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Error: Connection refused

**Problem:** Cannot connect to database.

**Solution:** 
1. Verify DATABASE_URL is correct
2. Check if Supabase project is active
3. Ensure your IP is allowed in Supabase settings
4. Test connection using psql: `psql $DATABASE_URL`

### Error: AI processing failure

**Problem:** Complaints fail with AI service error.

**Solution:**
1. Verify GROQ_API_KEY is correct
2. Check Groq API quota/limits
3. Test API key at https://console.groq.com

### Error: Rate limit exceeded

**Problem:** Getting 429 errors when testing.

**Solution:** Wait 1 minute between test runs, or temporarily increase rate limit in `src/middlewares/rateLimiter.js` for development.

## Development Workflow

1. Make code changes
2. Server auto-restarts (nodemon)
3. Test changes manually or run tests
4. Check logs for errors
5. Commit changes

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in environment
2. Use a process manager (PM2, systemd)
3. Set up proper logging
4. Configure reverse proxy (nginx)
5. Enable HTTPS
6. Set up monitoring and alerts
7. Configure database backups

Example PM2 deployment:
```bash
npm install -g pm2
pm2 start src/server.js --name nammafix-backend
pm2 save
pm2 startup
```

## Next Steps

- Review API documentation in README.md
- Check testing guide in TESTING.md
- Explore the codebase structure
- Set up monitoring and logging
- Configure CI/CD pipeline

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the design document in `.kiro/specs/nammafix-backend/design.md`
3. Check the requirements in `.kiro/specs/nammafix-backend/requirements.md`
