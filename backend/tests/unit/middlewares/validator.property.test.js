const fc = require('fast-check');
const request = require('supertest');
const express = require('express');

// Mock dependencies before importing
jest.mock('../../../src/config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

jest.mock('../../../src/services/aiService', () => ({
  analyzeComplaint: jest.fn()
}));

const {
  validateComplaintSubmission,
  validateStatusUpdate,
  handleValidationErrors
} = require('../../../src/middlewares/validator');
const aiService = require('../../../src/services/aiService');

/**
 * Property-Based Tests for Input Validation
 * 
 * These tests verify that validation rules correctly accept valid inputs
 * and reject invalid inputs across a wide range of randomized test cases.
 */

describe('Property Tests: Input Validation', () => {
  let app;

  beforeEach(() => {
    // Create a minimal Express app for testing validation
    app = express();
    app.use(express.json());
    
    // Test endpoint that uses validation
    app.post('/test/complaints', 
      validateComplaintSubmission,
      handleValidationErrors,
      (req, res) => {
        res.status(200).json({ success: true });
      }
    );

    // Reset mocks
    jest.clearAllMocks();
  });

  // Feature: nammafix-backend, Property 3: Description Length Validation
  // **Validates: Requirements 3.2, 3.7**
  describe('Property 3: Description Length Validation', () => {
    test('should reject descriptions shorter than 10 characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate strings with length 0-9
          fc.string({ maxLength: 9 }),
          fc.float({ min: -90, max: 90 }),
          fc.float({ min: -180, max: 180 }),
          async (description, latitude, longitude) => {
            const response = await request(app)
              .post('/test/complaints')
              .send({ description, latitude, longitude });

            // Property: Short descriptions should be rejected with 400
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Invalid input');
            expect(response.body.details).toMatch(/Description must be between 10 and 500 characters/);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should reject descriptions longer than 500 characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate strings with length 501-1000
          fc.string({ minLength: 501, maxLength: 1000 }),
          fc.float({ min: -90, max: 90 }),
          fc.float({ min: -180, max: 180 }),
          async (description, latitude, longitude) => {
            const response = await request(app)
              .post('/test/complaints')
              .send({ description, latitude, longitude });

            // Property: Long descriptions should be rejected with 400
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Invalid input');
            expect(response.body.details).toMatch(/Description must be between 10 and 500 characters/);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should accept descriptions between 10 and 500 characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate strings with length 10-500 that contain at least one non-whitespace character
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            const response = await request(app)
              .post('/test/complaints')
              .send({ description, latitude, longitude });

            // Property: Valid descriptions should pass validation (200 or other non-400 error)
            expect(response.status).not.toBe(400);
            // If it's 400, it should not be due to description length
            if (response.status === 400) {
              expect(response.body.details).not.toMatch(/Description must be between 10 and 500 characters/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nammafix-backend, Property 4: Latitude Range Validation
  // **Validates: Requirements 3.3, 3.7**
  describe('Property 4: Latitude Range Validation', () => {
    test('should reject latitude less than -90', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          // Generate latitude values below -90
          fc.double({ min: -1000, max: -90.01, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            const response = await request(app)
              .post('/test/complaints')
              .send({ description, latitude, longitude });

            // Property: Latitude below -90 should be rejected with 400
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Invalid input');
            expect(response.body.details).toMatch(/Latitude must be between -90 and 90/);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should reject latitude greater than 90', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          // Generate latitude values above 90
          fc.double({ min: 90.01, max: 1000, noNaN: true }),
          fc.float({ min: -180, max: 180 }),
          async (description, latitude, longitude) => {
            const response = await request(app)
              .post('/test/complaints')
              .send({ description, latitude, longitude });

            // Property: Latitude above 90 should be rejected with 400
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Invalid input');
            expect(response.body.details).toMatch(/Latitude must be between -90 and 90/);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should accept latitude between -90 and 90 (inclusive)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          // Generate valid latitude values
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            const response = await request(app)
              .post('/test/complaints')
              .send({ description, latitude, longitude });

            // Property: Valid latitude should pass validation
            expect(response.status).not.toBe(400);
            // If it's 400, it should not be due to latitude
            if (response.status === 400) {
              expect(response.body.details).not.toMatch(/Latitude must be between -90 and 90/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nammafix-backend, Property 5: Longitude Range Validation
  // **Validates: Requirements 3.4, 3.7**
  describe('Property 5: Longitude Range Validation', () => {
    test('should reject longitude less than -180', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          fc.float({ min: -90, max: 90, noNaN: true }),
          // Generate longitude values below -180
          fc.double({ min: -1000, max: -180.01, noNaN: true }),
          async (description, latitude, longitude) => {
            const response = await request(app)
              .post('/test/complaints')
              .send({ description, latitude, longitude });

            // Property: Longitude below -180 should be rejected with 400
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Invalid input');
            expect(response.body.details).toMatch(/Longitude must be between -180 and 180/);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should reject longitude greater than 180', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          fc.float({ min: -90, max: 90, noNaN: true }),
          // Generate longitude values above 180
          fc.double({ min: 180.01, max: 1000, noNaN: true }),
          async (description, latitude, longitude) => {
            const response = await request(app)
              .post('/test/complaints')
              .send({ description, latitude, longitude });

            // Property: Longitude above 180 should be rejected with 400
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Invalid input');
            expect(response.body.details).toMatch(/Longitude must be between -180 and 180/);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should accept longitude between -180 and 180 (inclusive)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          fc.float({ min: -90, max: 90, noNaN: true }),
          // Generate valid longitude values
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            const response = await request(app)
              .post('/test/complaints')
              .send({ description, latitude, longitude });

            // Property: Valid longitude should pass validation
            expect(response.status).not.toBe(400);
            // If it's 400, it should not be due to longitude
            if (response.status === 400) {
              expect(response.body.details).not.toMatch(/Longitude must be between -180 and 180/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nammafix-backend, Property 6: Image Format Validation
  // **Validates: Requirements 3.5, 3.7**
  describe('Property 6: Image Format Validation', () => {
    test('should reject image URLs with invalid extensions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          // Generate URLs with invalid extensions
          fc.constantFrom('.gif', '.bmp', '.svg', '.webp', '.pdf', '.txt', '.doc'),
          async (description, latitude, longitude, invalidExt) => {
            const image_url = `https://example.com/image${invalidExt}`;
            
            const response = await request(app)
              .post('/test/complaints')
              .send({ description, latitude, longitude, image_url });

            // Property: Invalid image formats should be rejected with 400
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Invalid input');
            expect(response.body.details).toMatch(/Image must be in jpg, jpeg, or png format/);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should accept image URLs with valid extensions (jpg, jpeg, png)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          // Generate URLs with valid extensions
          fc.constantFrom('.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG', '.Jpg', '.Jpeg', '.Png'),
          async (description, latitude, longitude, validExt) => {
            const image_url = `https://example.com/image${validExt}`;
            
            const response = await request(app)
              .post('/test/complaints')
              .send({ description, latitude, longitude, image_url });

            // Property: Valid image formats should pass validation
            expect(response.status).not.toBe(400);
            // If it's 400, it should not be due to image format
            if (response.status === 400) {
              expect(response.body.details).not.toMatch(/Image must be in jpg, jpeg, or png format/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should accept complaints without image_url (optional field)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            const response = await request(app)
              .post('/test/complaints')
              .send({ description, latitude, longitude });
            // Note: image_url is intentionally omitted

            // Property: Omitting optional image_url should pass validation
            expect(response.status).not.toBe(400);
            // If it's 400, it should not be due to image_url
            if (response.status === 400) {
              expect(response.body.details).not.toMatch(/Image/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nammafix-backend, Property 7: Validation Before AI Processing
  // **Validates: Requirements 3.8, 10.5**
  describe('Property 7: Validation Before AI Processing', () => {
    test('should not call AI service when validation fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate invalid inputs
          fc.oneof(
            // Invalid description (too short)
            fc.record({
              description: fc.string({ maxLength: 9 }),
              latitude: fc.float({ min: -90, max: 90 }),
              longitude: fc.float({ min: -180, max: 180 })
            }),
            // Invalid latitude
            fc.record({
              description: fc.string({ minLength: 10, maxLength: 500 }),
              latitude: fc.double({ min: 100, max: 1000, noNaN: true }),
              longitude: fc.float({ min: -180, max: 180 })
            }),
            // Invalid longitude
            fc.record({
              description: fc.string({ minLength: 10, maxLength: 500 }),
              latitude: fc.float({ min: -90, max: 90 }),
              longitude: fc.double({ min: 200, max: 1000, noNaN: true })
            }),
            // Invalid image format
            fc.record({
              description: fc.string({ minLength: 10, maxLength: 500 }),
              latitude: fc.float({ min: -90, max: 90 }),
              longitude: fc.float({ min: -180, max: 180 }),
              image_url: fc.constant('https://example.com/image.gif')
            })
          ),
          async (invalidInput) => {
            // Reset the mock call count
            aiService.analyzeComplaint.mockClear();

            const response = await request(app)
              .post('/test/complaints')
              .send(invalidInput);

            // Property: Validation should fail with 400
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Invalid input');

            // Property: AI service should NEVER be called when validation fails
            expect(aiService.analyzeComplaint).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should validate all fields before processing', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate inputs with multiple validation errors
          fc.string({ maxLength: 5 }), // Invalid description
          fc.double({ min: 100, max: 200, noNaN: true }), // Invalid latitude
          fc.double({ min: 200, max: 300, noNaN: true }), // Invalid longitude
          async (description, latitude, longitude) => {
            aiService.analyzeComplaint.mockClear();

            const response = await request(app)
              .post('/test/complaints')
              .send({ description, latitude, longitude });

            // Property: Should return 400 for invalid input
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Invalid input');

            // Property: Should return first validation error encountered
            expect(response.body).toHaveProperty('details');
            expect(typeof response.body.details).toBe('string');

            // Property: AI service should not be called
            expect(aiService.analyzeComplaint).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Additional property: Validation should handle edge cases
  describe('Additional Properties: Edge Cases', () => {
    test('should handle missing required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant({}), // All fields missing
            fc.constant({ description: 'Valid description here' }), // Missing coordinates
            fc.constant({ latitude: 12.9716, longitude: 77.5946 }), // Missing description
            fc.constant({ description: 'Valid description', latitude: 12.9716 }), // Missing longitude
            fc.constant({ description: 'Valid description', longitude: 77.5946 }) // Missing latitude
          ),
          async (incompleteInput) => {
            const response = await request(app)
              .post('/test/complaints')
              .send(incompleteInput);

            // Property: Missing required fields should result in 400
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
          }
        ),
        { numRuns: 50 }
      );
    });

    test('should handle non-numeric coordinate values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.oneof(
            fc.constant('not-a-number'),
            fc.constant('12.34.56'),
            fc.constant('abc'),
            fc.constant(null),
            fc.constant(undefined)
          ),
          async (description, invalidCoordinate) => {
            const response = await request(app)
              .post('/test/complaints')
              .send({ 
                description, 
                latitude: invalidCoordinate, 
                longitude: invalidCoordinate 
              });

            // Property: Non-numeric coordinates should be rejected
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
          }
        ),
        { numRuns: 50 }
      );
    });

    test('should trim whitespace from description before validation', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate description with leading/trailing whitespace
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          fc.nat({ max: 10 }), // Leading spaces
          fc.nat({ max: 10 }), // Trailing spaces
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, leadingSpaces, trailingSpaces, latitude, longitude) => {
            const paddedDescription = ' '.repeat(leadingSpaces) + description + ' '.repeat(trailingSpaces);
            
            const response = await request(app)
              .post('/test/complaints')
              .send({ description: paddedDescription, latitude, longitude });

            // Property: Whitespace should be trimmed before length validation
            // If the trimmed description is valid length, it should pass
            const trimmedLength = description.trim().length;
            if (trimmedLength >= 10 && trimmedLength <= 500) {
              expect(response.status).not.toBe(400);
              if (response.status === 400) {
                expect(response.body.details).not.toMatch(/Description must be between 10 and 500 characters/);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
