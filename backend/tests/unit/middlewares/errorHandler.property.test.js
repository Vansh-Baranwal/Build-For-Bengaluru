const fc = require('fast-check');
const request = require('supertest');
const express = require('express');

// Mock dependencies before importing
jest.mock('../../../src/config/env', () => ({
  database: {
    url: 'postgresql://test:test@localhost:5432/test',
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-key'
  },
  groq: {
    apiKey: 'test-groq-key',
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-70b-versatile'
  },
  server: {
    port: 3000,
    nodeEnv: 'test'
  }
}));

jest.mock('../../../src/config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

jest.mock('../../../src/database/db', () => ({
  query: jest.fn(),
  checkConnection: jest.fn()
}));

const {
  errorHandler,
  ValidationError,
  NotFoundError,
  AIServiceError,
  DatabaseError
} = require('../../../src/middlewares/errorHandler');
const logger = require('../../../src/config/logger');

/**
 * Property-Based Tests for Error Handling
 * 
 * These tests verify that the error handler middleware correctly processes
 * different types of errors and returns appropriate HTTP status codes and
 * response formats across a wide range of randomized test cases.
 */

describe('Property Tests: Error Handling', () => {
  let app;

  beforeEach(() => {
    // Create a minimal Express app for testing error handling
    app = express();
    app.use(express.json());

    // Reset mocks
    jest.clearAllMocks();
  });

  // Feature: nammafix-backend, Property 25: Invalid Input Returns 400
  // **Validates: Requirements 10.1, 10.4**
  describe('Property 25: Invalid Input Returns 400', () => {
    test('should return 400 for ValidationError with any error message', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random error messages
          fc.string({ minLength: 1, maxLength: 200 }),
          async (errorMessage) => {
            // Create test route that throws ValidationError
            const testApp = express();
            testApp.use(express.json());
            testApp.get('/test', (req, res, next) => {
              next(new ValidationError(errorMessage));
            });
            testApp.use(errorHandler);

            const response = await request(testApp).get('/test');

            // Property: ValidationError should always return 400
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'ValidationError');
            expect(response.body).toHaveProperty('details', errorMessage);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should return 400 with descriptive error message for validation failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various validation error scenarios
          fc.oneof(
            fc.constant('Description must be between 10 and 500 characters'),
            fc.constant('Latitude must be between -90 and 90'),
            fc.constant('Longitude must be between -180 and 180'),
            fc.constant('Image must be in jpg, jpeg, or png format'),
            fc.constant('Status must be one of: pending, in_progress, resolved'),
            fc.string({ minLength: 10, maxLength: 100 }).map(s => `Invalid input: ${s}`)
          ),
          async (validationMessage) => {
            const testApp = express();
            testApp.use(express.json());
            testApp.post('/test', (req, res, next) => {
              next(new ValidationError(validationMessage));
            });
            testApp.use(errorHandler);

            const response = await request(testApp).post('/test').send({});

            // Property: All validation errors should return 400 with descriptive message
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'ValidationError');
            expect(response.body).toHaveProperty('details', validationMessage);
            expect(response.body.details).toBeTruthy();
            expect(typeof response.body.details).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should return JSON format for all validation errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (errorMessage) => {
            const testApp = express();
            testApp.use(express.json());
            testApp.get('/test', (req, res, next) => {
              next(new ValidationError(errorMessage));
            });
            testApp.use(errorHandler);

            const response = await request(testApp).get('/test');

            // Property: Response should be valid JSON with error and details fields
            expect(response.status).toBe(400);
            expect(response.headers['content-type']).toMatch(/json/);
            expect(response.body).toBeInstanceOf(Object);
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('details');
            expect(typeof response.body.error).toBe('string');
            expect(typeof response.body.details).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should log validation errors at warn level', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (errorMessage) => {
            logger.warn.mockClear();

            const testApp = express();
            testApp.use(express.json());
            testApp.get('/test', (req, res, next) => {
              next(new ValidationError(errorMessage));
            });
            testApp.use(errorHandler);

            await request(testApp).get('/test');

            // Property: Validation errors (4xx) should be logged at warn level
            expect(logger.warn).toHaveBeenCalled();
            expect(logger.error).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: nammafix-backend, Property 26: Internal Errors Return 500
  // **Validates: Requirements 10.3, 10.4**
  describe('Property 26: Internal Errors Return 500', () => {
    test('should return 500 for AIServiceError with any error message', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random error messages
          fc.string({ minLength: 1, maxLength: 200 }),
          async (errorMessage) => {
            const testApp = express();
            testApp.use(express.json());
            testApp.post('/test', (req, res, next) => {
              next(new AIServiceError(errorMessage));
            });
            testApp.use(errorHandler);

            const response = await request(testApp).post('/test').send({});

            // Property: AIServiceError should always return 500
            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error', 'AIServiceError');
            expect(response.body).toHaveProperty('details');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should return 500 for DatabaseError with any error message', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random error messages
          fc.string({ minLength: 1, maxLength: 200 }),
          async (errorMessage) => {
            const testApp = express();
            testApp.use(express.json());
            testApp.get('/test', (req, res, next) => {
              next(new DatabaseError(errorMessage));
            });
            testApp.use(errorHandler);

            const response = await request(testApp).get('/test');

            // Property: DatabaseError should always return 500
            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error', 'DatabaseError');
            expect(response.body).toHaveProperty('details');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should return 500 for generic errors without statusCode', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random error messages
          fc.string({ minLength: 1, maxLength: 200 }),
          async (errorMessage) => {
            const testApp = express();
            testApp.use(express.json());
            testApp.get('/test', (req, res, next) => {
              // Generic Error without statusCode property
              next(new Error(errorMessage));
            });
            testApp.use(errorHandler);

            const response = await request(testApp).get('/test');

            // Property: Generic errors should default to 500
            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('details');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should return JSON format for all internal errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.record({ type: fc.constant('ai'), message: fc.string({ minLength: 1, maxLength: 200 }) }),
            fc.record({ type: fc.constant('db'), message: fc.string({ minLength: 1, maxLength: 200 }) }),
            fc.record({ type: fc.constant('generic'), message: fc.string({ minLength: 1, maxLength: 200 }) })
          ),
          async (errorSpec) => {
            const testApp = express();
            testApp.use(express.json());
            testApp.post('/test', (req, res, next) => {
              if (errorSpec.type === 'ai') {
                next(new AIServiceError(errorSpec.message));
              } else if (errorSpec.type === 'db') {
                next(new DatabaseError(errorSpec.message));
              } else {
                next(new Error(errorSpec.message));
              }
            });
            testApp.use(errorHandler);

            const response = await request(testApp).post('/test').send({});

            // Property: All internal errors should return JSON with error and details
            expect(response.status).toBe(500);
            expect(response.headers['content-type']).toMatch(/json/);
            expect(response.body).toBeInstanceOf(Object);
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('details');
            expect(typeof response.body.error).toBe('string');
            expect(typeof response.body.details).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should log internal errors at error level', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.record({ type: fc.constant('ai'), message: fc.string({ minLength: 1, maxLength: 200 }) }),
            fc.record({ type: fc.constant('db'), message: fc.string({ minLength: 1, maxLength: 200 }) }),
            fc.record({ type: fc.constant('generic'), message: fc.string({ minLength: 1, maxLength: 200 }) })
          ),
          async (errorSpec) => {
            logger.error.mockClear();
            logger.warn.mockClear();

            const testApp = express();
            testApp.use(express.json());
            testApp.get('/test', (req, res, next) => {
              if (errorSpec.type === 'ai') {
                next(new AIServiceError(errorSpec.message));
              } else if (errorSpec.type === 'db') {
                next(new DatabaseError(errorSpec.message));
              } else {
                next(new Error(errorSpec.message));
              }
            });
            testApp.use(errorHandler);

            await request(testApp).get('/test');

            // Property: Internal errors (5xx) should be logged at error level
            expect(logger.error).toHaveBeenCalled();
            expect(logger.warn).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    test('should not expose sensitive information in production mode', async () => {
      // Set NODE_ENV to production for this test
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await fc.assert(
        fc.asyncProperty(
          // Generate non-empty error messages (filter out whitespace-only strings)
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          async (errorMessage) => {
            const testApp = express();
            testApp.use(express.json());
            testApp.get('/test', (req, res, next) => {
              next(new DatabaseError(errorMessage));
            });
            testApp.use(errorHandler);

            const response = await request(testApp).get('/test');

            // Property: In production, internal errors should return generic message
            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('details');
            // In production, details should be generic, not the actual error message
            expect(response.body.details).toBe('An unexpected error occurred');
          }
        ),
        { numRuns: 50 }
      );

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });
  });

  // Additional properties: Error handling consistency
  describe('Additional Properties: Error Handling Consistency', () => {
    test('should return 404 for NotFoundError', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (errorMessage) => {
            const testApp = express();
            testApp.use(express.json());
            testApp.get('/test', (req, res, next) => {
              next(new NotFoundError(errorMessage));
            });
            testApp.use(errorHandler);

            const response = await request(testApp).get('/test');

            // Property: NotFoundError should return 404
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'NotFoundError');
            expect(response.body).toHaveProperty('details', errorMessage);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should handle errors with custom statusCode property', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 400, max: 599 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          async (statusCode, errorMessage) => {
            const testApp = express();
            testApp.use(express.json());
            testApp.get('/test', (req, res, next) => {
              const error = new Error(errorMessage);
              error.statusCode = statusCode;
              next(error);
            });
            testApp.use(errorHandler);

            const response = await request(testApp).get('/test');

            // Property: Custom statusCode should be respected
            expect(response.status).toBe(statusCode);
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('details');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should always return consistent JSON structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.record({ errorType: fc.constant('validation'), message: fc.string({ minLength: 1 }) }),
            fc.record({ errorType: fc.constant('notfound'), message: fc.string({ minLength: 1 }) }),
            fc.record({ errorType: fc.constant('ai'), message: fc.string({ minLength: 1 }) }),
            fc.record({ errorType: fc.constant('db'), message: fc.string({ minLength: 1 }) }),
            fc.record({ errorType: fc.constant('generic'), message: fc.string({ minLength: 1 }) })
          ),
          async (errorSpec) => {
            const testApp = express();
            testApp.use(express.json());
            testApp.get('/test', (req, res, next) => {
              switch (errorSpec.errorType) {
                case 'validation':
                  next(new ValidationError(errorSpec.message));
                  break;
                case 'notfound':
                  next(new NotFoundError(errorSpec.message));
                  break;
                case 'ai':
                  next(new AIServiceError(errorSpec.message));
                  break;
                case 'db':
                  next(new DatabaseError(errorSpec.message));
                  break;
                default:
                  next(new Error(errorSpec.message));
              }
            });
            testApp.use(errorHandler);

            const response = await request(testApp).get('/test');

            // Property: All errors should return consistent JSON structure
            expect(response.body).toBeInstanceOf(Object);
            expect(Object.keys(response.body)).toEqual(['error', 'details']);
            expect(typeof response.body.error).toBe('string');
            expect(typeof response.body.details).toBe('string');
            expect(response.body.error.length).toBeGreaterThan(0);
            expect(response.body.details.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should include request context in error logs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.constantFrom('GET', 'POST', 'PATCH', 'DELETE'),
          async (errorMessage, method) => {
            logger.error.mockClear();

            const testApp = express();
            testApp.use(express.json());
            
            const handler = (req, res, next) => {
              next(new DatabaseError(errorMessage));
            };

            if (method === 'GET') testApp.get('/test', handler);
            else if (method === 'POST') testApp.post('/test', handler);
            else if (method === 'PATCH') testApp.patch('/test', handler);
            else testApp.delete('/test', handler);

            testApp.use(errorHandler);

            await request(testApp)[method.toLowerCase()]('/test').send({});

            // Property: Error logs should include request context (path, method)
            expect(logger.error).toHaveBeenCalled();
            const logCall = logger.error.mock.calls[0][0];
            expect(logCall).toHaveProperty('path', '/test');
            expect(logCall).toHaveProperty('method', method);
            expect(logCall).toHaveProperty('statusCode', 500);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
