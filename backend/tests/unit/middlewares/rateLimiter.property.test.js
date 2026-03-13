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

const { complaintRateLimiter } = require('../../../src/middlewares/rateLimiter');
const {
  validateComplaintSubmission,
  handleValidationErrors
} = require('../../../src/middlewares/validator');

/**
 * Property-Based Tests for Rate Limiting
 * 
 * These tests verify that rate limiting correctly enforces the 5 requests per minute
 * limit and returns 429 status code when the limit is exceeded.
 */

describe('Property Tests: Rate Limiting', () => {
  let app;

  beforeEach(() => {
    // Create a minimal Express app for testing rate limiting
    app = express();
    app.use(express.json());
    
    // Test endpoint with rate limiting
    app.post('/test/complaints', 
      complaintRateLimiter,
      validateComplaintSubmission,
      handleValidationErrors,
      (req, res) => {
        res.status(201).json({ success: true, complaint_id: 'test-id' });
      }
    );

    // Reset mocks
    jest.clearAllMocks();
  });

  // Feature: nammafix-backend, Property 27: Rate Limit Enforcement
  // **Validates: Requirements 15.1, 15.3**
  describe('Property 27: Rate limit enforcement', () => {
    test('should return 429 when 6th request is made within 60 seconds', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid complaint data
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            const complaintData = { description, latitude, longitude };

            // Make 5 requests (should all succeed)
            for (let i = 0; i < 5; i++) {
              const response = await request(app)
                .post('/test/complaints')
                .send(complaintData);
              
              // First 5 requests should not be rate limited
              expect(response.status).not.toBe(429);
            }

            // Make the 6th request (should be rate limited)
            const sixthResponse = await request(app)
              .post('/test/complaints')
              .send(complaintData);

            // Property: 6th request within 60 seconds should return 429
            expect(sixthResponse.status).toBe(429);
            expect(sixthResponse.body).toHaveProperty('error', 'Too many requests');
            expect(sixthResponse.body.details).toMatch(/Maximum 5 complaint submissions per minute/);
          }
        ),
        { numRuns: 10 } // Reduced runs since this test makes multiple requests
      );
    });

    test('should allow exactly 5 requests within the rate limit window', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid complaint data
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            const complaintData = { description, latitude, longitude };

            // Make exactly 5 requests
            for (let i = 0; i < 5; i++) {
              const response = await request(app)
                .post('/test/complaints')
                .send(complaintData);
              
              // Property: All 5 requests should succeed (not rate limited)
              expect(response.status).not.toBe(429);
              // Should be either 201 (success) or 400 (validation error), but not 429
              expect([200, 201, 400]).toContain(response.status);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    test('should reject all requests after limit is exceeded', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          // Generate number of additional requests to test (1-5)
          fc.integer({ min: 1, max: 5 }),
          async (description, latitude, longitude, additionalRequests) => {
            const complaintData = { description, latitude, longitude };

            // Make 5 requests to hit the limit
            for (let i = 0; i < 5; i++) {
              await request(app)
                .post('/test/complaints')
                .send(complaintData);
            }

            // Make additional requests beyond the limit
            for (let i = 0; i < additionalRequests; i++) {
              const response = await request(app)
                .post('/test/complaints')
                .send(complaintData);

              // Property: All requests after the 5th should return 429
              expect(response.status).toBe(429);
              expect(response.body).toHaveProperty('error', 'Too many requests');
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
