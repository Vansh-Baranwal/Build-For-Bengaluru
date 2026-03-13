# Database Property-Based Tests

## Overview

This directory contains property-based tests for database spatial functions using PostGIS. These tests verify universal properties that should hold true across all valid inputs.

## Test File: spatial.property.test.js

### Property 28: Distance Calculation Non-Negativity

**Validates**: Requirements 14.2 (Geographic Utility Module - distance calculations)

**Description**: Tests that PostGIS ST_Distance function returns non-negative values for any valid coordinate pairs.

**Test Strategy**:
- Generates 100 random coordinate pairs within valid ranges:
  - Latitude: -90 to 90
  - Longitude: -180 to 180
- Executes ST_Distance query against the database
- Verifies distance is always >= 0
- Verifies distance is a finite number

**Additional Properties Tested**:
1. **Symmetry**: Distance from A to B equals distance from B to A
2. **Identity**: Distance from a point to itself is zero

## Running the Tests

### Prerequisites

1. **Database Setup**: You need a PostgreSQL database with PostGIS extension enabled
2. **Environment Variables**: Create a `.env` file in the `backend` directory with:

```env
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
GROQ_API_KEY=your-groq-api-key-here
```

### Run the Tests

```bash
# Run all database property tests
npm test -- tests/unit/database/spatial.property.test.js

# Run with verbose output
npm test -- tests/unit/database/spatial.property.test.js --verbose

# Run without coverage report
npm test -- tests/unit/database/spatial.property.test.js --no-coverage
```

## Test Configuration

- **Framework**: Jest + fast-check
- **Iterations**: 100 runs per property (as per spec requirements)
- **Timeout**: 30 seconds per test (to accommodate database operations)
- **Database**: Requires live PostgreSQL connection with PostGIS

## Expected Results

All tests should pass, confirming:
- ✓ ST_Distance always returns non-negative values
- ✓ ST_Distance is symmetric (d(A,B) = d(B,A))
- ✓ ST_Distance returns 0 for identical points

## Troubleshooting

### Error: Missing required environment variables

**Solution**: Create a `.env` file with the required database credentials.

### Error: PostGIS extension not available

**Solution**: Enable PostGIS in your database:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Error: Connection timeout

**Solution**: 
- Check database connectivity
- Verify DATABASE_URL is correct
- Ensure database is running and accessible

## Test Design Rationale

**Why Property-Based Testing?**

Property-based tests are ideal for spatial functions because:
1. **Edge Case Coverage**: Automatically tests boundary conditions (poles, date line, etc.)
2. **Universal Properties**: Distance calculations have mathematical properties that should always hold
3. **Regression Prevention**: Catches bugs that might only appear with specific coordinate combinations

**Why Test Against Real Database?**

- Validates actual PostGIS behavior, not mocked implementations
- Ensures database configuration is correct
- Tests real-world query performance
- Verifies spatial indexing works correctly

## Related Documentation

- Design Document: `.kiro/specs/nammafix-backend/design.md` (Property 28)
- Requirements: `.kiro/specs/nammafix-backend/requirements.md` (Requirement 14.2)
- Tasks: `.kiro/specs/nammafix-backend/tasks.md` (Task 3.2)
