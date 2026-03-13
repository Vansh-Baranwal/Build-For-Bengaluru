const fc = require('fast-check');
const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');

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
  handleValidationErrors
} = require('../../../src/middlewares/validator');

/**
 * Property-Based Tests for Rate Limiting
 * 
 * These tests verify that rate limiting correctly enforces the 5 requests per minute
 * limit and returns 429 status code when the limit is exceeded.
 */

describe('Property Tests: Rate Limiting', () => {
  // Helper function to create a fresh app instance with a new rate limiter for each test
  const createApp = () => {
    const app = express();
    app.use(express.json());
    
    // Create a fresh rate limiter instance for this app
    const freshRateLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute window
      max: 5, // Maximum 5 requests per window
      message: {
        error: 'Too many requests',
        details: 'Maximum 5 complaint submissions per minute. Please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Too many requests',
          details: 'Maximum 5 complaint submissions per minute. Please try again later.'
        });
      }
    });
    
    // Test endpoint with rate limiting
    app.post('/test/complaints', 
      freshRateLimiter,
      validateComplaintSubmission,
      handleValidationErrors,
      (req, res) => {
        res.status(201).json({ success: true, complaint_id: 'test-id' });
      }
    );

    return app;
  };

  beforeEach(() => {
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
            // Create a fresh app for each property test iteration
            const app = createApp();
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
        { numRuns: 5 } // Test with multiple random inputs
      );
    });

    test('should reject all requests after limit is exceeded', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          // Generate number of additional requests to test (1-3)
          fc.integer({ min: 1, max: 3 }),
          async (description, latitude, longitude, additionalRequests) => {
            // Create a fresh app for each property test iteration
            const app = createApp();
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
        { numRuns: 5 } // Test with multiple random inputs
      );
    });
  });
});
