# AI Service Property-Based Tests

## Overview

This directory contains property-based tests for the AI service that integrates with Groq API. These tests verify universal properties about the AI service's response structure and error handling.

## Test File: aiService.property.test.js

### Property 1: AI Service Returns Valid Structured Data

**Validates**: Requirements 2.2, 2.3, 2.4, 2.5

**Description**: Tests that successful Groq API responses are parsed correctly and contain valid category, severity, and department fields.

**Test Strategy**:
- Generates 100 random complaint descriptions (10-500 characters)
- Generates random valid AI responses with:
  - Category from valid set: pothole, garbage, flooding, water leak, streetlight failure, traffic signal issue, drainage
  - Severity from valid set: low, medium, high
  - Department as a non-empty string
- Mocks Groq API responses to avoid external API calls
- Verifies the parsed result contains all required fields with valid values

**Properties Verified**:
1. ✓ Result contains category, severity, and department fields
2. ✓ Category is from the valid set (Requirement 2.2)
3. ✓ Severity is from the valid set (Requirement 2.3)
4. ✓ Department is a non-empty string (Requirement 2.4)
5. ✓ Result structure matches expected format (Requirement 2.5)

### Additional Properties Tested

#### Whitespace Handling
Tests that the AI service can parse JSON responses with extra whitespace or formatting.

#### Text Extraction
Tests that the AI service can extract JSON from responses that include surrounding text (e.g., "Here is the analysis: {...}").

#### Invalid Category Fallback
Tests that when the AI returns an invalid category, the service uses a fallback value ('garbage') while still returning a valid response.

#### Invalid Severity Fallback
Tests that when the AI returns an invalid severity, the service uses a fallback value ('medium') while still returning a valid response.

#### Input Validation
Tests that the service rejects invalid inputs (null, undefined, empty string, non-string types) with appropriate error messages.

#### Empty Response Handling
Tests that the service throws an error when the Groq API returns an empty response.

#### Missing Fields Handling
Tests that the service throws an error when the API response is missing required fields (category, severity, or department).

## Running the Tests

### Prerequisites

1. **Dependencies**: Install required packages:
```bash
npm install
```

2. **Environment Variables**: Create a `.env` file (not required for these tests since API is mocked):
```env
GROQ_API_KEY=your-groq-api-key-here
```

### Run the Tests

```bash
# Run all AI service property tests
npm test -- tests/unit/services/aiService.property.test.js

# Run with verbose output
npm test -- tests/unit/services/aiService.property.test.js --verbose

# Run without coverage report
npm test -- tests/unit/services/aiService.property.test.js --no-coverage

# Run all unit tests
npm run test:unit
```

## Test Configuration

- **Framework**: Jest + fast-check
- **Iterations**: 100 runs for main properties, 50 runs for error cases
- **Mocking**: Axios is mocked to avoid actual API calls
- **Timeout**: Default Jest timeout (5 seconds)

## Expected Results

All tests should pass, confirming:
- ✓ AI service returns valid structured data with all required fields
- ✓ Category values are always from the valid set
- ✓ Severity values are always from the valid set
- ✓ Department is always a non-empty string
- ✓ Service handles malformed responses gracefully
- ✓ Service validates input and rejects invalid descriptions
- ✓ Service uses fallback values for invalid AI responses

## Test Design Rationale

### Why Property-Based Testing?

Property-based tests are ideal for the AI service because:
1. **Robustness**: Tests the service with a wide variety of inputs and responses
2. **Edge Case Coverage**: Automatically discovers edge cases in parsing and validation logic
3. **Specification Validation**: Ensures the service always returns data matching the specification
4. **Regression Prevention**: Catches bugs that might only appear with specific input combinations

### Why Mock the API?

- **Speed**: Tests run instantly without network latency
- **Reliability**: Tests don't fail due to API downtime or rate limits
- **Determinism**: Tests produce consistent results
- **Cost**: Avoids consuming API quota during testing
- **Isolation**: Tests focus on the service logic, not the external API

### Test Coverage

These property tests cover:
- ✓ Happy path: Valid responses with all required fields
- ✓ Parsing robustness: Whitespace, surrounding text, formatting variations
- ✓ Validation: Invalid categories, severities, missing fields
- ✓ Error handling: Empty responses, malformed JSON, invalid input
- ✓ Fallback behavior: Default values for invalid AI responses

## Troubleshooting

### Error: Cannot find module 'fast-check'

**Solution**: Install dependencies:
```bash
npm install
```

### Error: Cannot find module '../../../src/services/aiService'

**Solution**: Ensure you're running tests from the `backend` directory:
```bash
cd backend
npm test
```

### Tests fail with "axios.post is not a function"

**Solution**: This indicates the mock isn't working. Ensure jest.mock('axios') is at the top of the test file.

## Related Documentation

- Design Document: `.kiro/specs/nammafix-backend/design.md` (Property 1)
- Requirements: `.kiro/specs/nammafix-backend/requirements.md` (Requirements 2.2-2.5)
- Tasks: `.kiro/specs/nammafix-backend/tasks.md` (Task 4.2)
- AI Service Implementation: `backend/src/services/aiService.js`

## Integration with CI/CD

These tests should be run as part of the CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run unit tests
  run: npm run test:unit
```

The tests are fast (< 5 seconds) and don't require external dependencies, making them ideal for continuous integration.
