# NammaFix Backend

AI-powered civic grievance platform backend built with Node.js, Express, PostgreSQL (Supabase), and PostGIS.

## Features

- AI-powered complaint categorization using Groq API
- Spatial clustering with PostGIS
- Privacy-first API design
- Rate limiting and validation
- RESTful API endpoints

## Prerequisites

- Node.js 16+
- PostgreSQL with PostGIS extension
- Supabase account
- Groq API key

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. Run database migrations (see database/migrations/)

5. Start the server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `GROQ_API_KEY` - Groq API key for AI processing
- `PORT` - Server port (default: 3000)

## API Endpoints

- `POST /api/complaints` - Submit a new complaint
- `GET /api/complaints/:id` - Get complaint status
- `PATCH /api/complaints/:id/status` - Update complaint status
- `GET /api/trending` - Get trending issues
- `GET /api/heatmap` - Get heatmap data
- `GET /health` - Health check

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── database/        # Database connection
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic
│   ├── services/        # External services (AI, etc.)
│   ├── middlewares/     # Express middlewares
│   └── utils/           # Utility functions
└── server.js            # Entry point
```

## Testing

```bash
npm test
```

## License

MIT
