# Testing Guide for NammaFix Backend

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual modules
│   └── utils/
│       └── geoUtils.test.js
├── integration/             # Integration tests for API endpoints
│   └── api/
│       ├── complaints.test.js
│       └── health.test.js
└── property/               # Property-based tests (optional)
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

## Test Coverage

The test suite includes:

### Unit Tests
- ✅ Geographic utility functions (createPoint, calculateDistance)
- ✅ Distance calculation validation
- ✅ Coordinate format validation

### Integration Tests
- ✅ POST /api/complaints - Create complaint with valid data
- ✅ POST /api/complaints - Reject invalid description length
- ✅ POST /api/complaints - Reject invalid latitude/longitude
- ✅ POST /api/complaints - Reject invalid image format
- ✅ POST /api/complaints - Rate limiting enforcement
- ✅ GET /api/complaints/:id - Retrieve complaint
- ✅ GET /api/complaints/:id - Return 404 for non-existent complaint
- ✅ PATCH /api/complaints/:id/status - Update status
- ✅ PATCH /api/complaints/:id/status - Reject invalid status
- ✅ GET /api/trending - Return trending clusters
- ✅ GET /api/heatmap - Return heatmap data
- ✅ GET /health - Health check endpoint

## Test Configuration

Tests use:
- **Jest** for test framework
- **Supertest** for HTTP assertions
- **Mocking** for database and external API calls

## Mocking Strategy

### Database Mocking
Database calls are mocked to avoid requiring a live database during tests:
```javascript
jest.mock('../../../src/database/db');
const db = require('../../../src/database/db');
db.query.mockResolvedValue({ rows: [...] });
```

### AI Service Mocking
Groq API calls are mocked to avoid external dependencies:
```javascript
jest.mock('../../../src/services/aiService');
const aiService = require('../../../src/services/aiService');
aiService.analyzeComplaint.mockResolvedValue({
  category: 'pothole',
  severity: 'high',
  department: 'Roads'
});
```

## Coverage Goals

- Overall: 80% minimum
- Controllers: 90% minimum
- Services: 90% minimum
- Utilities: 95% minimum
- Routes: 80% minimum

## Property-Based Testing (Optional)

Property-based tests validate universal correctness properties across randomized inputs. These are marked as optional in the implementation plan but provide additional confidence in the system's correctness.

To add property-based tests, install fast-check:
```bash
npm install --save-dev fast-check
```

See the design document for 28 correctness properties that can be validated with property-based tests.

## CI/CD Integration

Tests should be run in CI/CD pipeline:
1. Install dependencies
2. Run linter
3. Run unit tests
4. Run integration tests
5. Generate coverage report
6. Fail build if coverage < 80%

## Manual Testing

For manual testing with real database and API:
1. Set up .env file with real credentials
2. Run database migrations
3. Start server: `npm run dev`
4. Use Postman or curl to test endpoints

Example curl commands:
```bash
# Health check
curl http://localhost:3000/health

# Create complaint
curl -X POST http://localhost:3000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Large pothole on MG Road causing traffic issues",
    "latitude": 12.9716,
    "longitude": 77.5946
  }'

# Get complaint
curl http://localhost:3000/api/complaints/{complaint_id}

# Update status
curl -X PATCH http://localhost:3000/api/complaints/{complaint_id}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'

# Get trending
curl http://localhost:3000/api/trending

# Get heatmap
curl http://localhost:3000/api/heatmap
```
