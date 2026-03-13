const fc = require('fast-check');

// Mock axios and config before importing aiService
jest.mock('axios');
jest.mock('../../../src/config/env', () => ({
  groq: {
    apiKey: 'test-api-key'
  }
}));
jest.mock('../../../src/config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

const aiService = require('../../../src/services/aiService');
const axios = require('axios');

/**
 * Property-Based Tests for AI Service Response Structure
 * 
 * These tests verify that the AI service returns valid structured data
 * when the Groq API responds successfully.
 */

describe('Property Tests: AI Service Response Structure', () => {
  // Feature: nammafix-backend, Property 1: AI Service Returns Valid Structured Data
  // **Validates: Requirements 2.2, 2.3, 2.4, 2.5**
  test('analyzeComplaint should return valid category, severity, and department fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random complaint descriptions
        fc.string({ minLength: 10, maxLength: 500 }),
        // Generate random valid AI responses
        fc.record({
          category: fc.constantFrom(...aiService.VALID_CATEGORIES),
          severity: fc.constantFrom(...aiService.VALID_SEVERITIES),
          department: fc.string({ minLength: 5, maxLength: 50 })
        }),
        async (description, mockAiResponse) => {
          // Mock successful Groq API response
          axios.post.mockResolvedValueOnce({
            data: {
              choices: [
                {
                  message: {
                    content: JSON.stringify(mockAiResponse)
                  }
                }
              ]
            }
          });

          // Call the AI service
          const result = await aiService.analyzeComplaint(description);

          // Property: Result must contain all required fields
          expect(result).toHaveProperty('category');
          expect(result).toHaveProperty('severity');
          expect(result).toHaveProperty('department');

          // Property: Category must be from valid set (Requirement 2.2)
          expect(aiService.VALID_CATEGORIES).toContain(result.category);

          // Property: Severity must be from valid set (Requirement 2.3)
          expect(aiService.VALID_SEVERITIES).toContain(result.severity);

          // Property: Department must be a non-empty string (Requirement 2.4)
          expect(typeof result.department).toBe('string');
          expect(result.department.length).toBeGreaterThan(0);

          // Property: Result structure matches expected format (Requirement 2.5)
          expect(Object.keys(result).sort()).toEqual(['category', 'department', 'severity']);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as per spec requirements
    );
  });

  // Property: AI service should handle responses with extra whitespace
  test('analyzeComplaint should parse JSON responses with extra whitespace', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 500 }),
        fc.record({
          category: fc.constantFrom(...aiService.VALID_CATEGORIES),
          severity: fc.constantFrom(...aiService.VALID_SEVERITIES),
          department: fc.string({ minLength: 5, maxLength: 50 })
        }),
        async (description, mockAiResponse) => {
          // Mock response with extra whitespace
          const jsonWithWhitespace = `\n\n  ${JSON.stringify(mockAiResponse, null, 2)}  \n\n`;
          
          axios.post.mockResolvedValueOnce({
            data: {
              choices: [
                {
                  message: {
                    content: jsonWithWhitespace
                  }
                }
              ]
            }
          });

          const result = await aiService.analyzeComplaint(description);

          // Property: Should successfully parse despite whitespace
          expect(result.category).toBe(mockAiResponse.category);
          expect(result.severity).toBe(mockAiResponse.severity);
          expect(result.department).toBe(mockAiResponse.department);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: AI service should handle responses with surrounding text
  test('analyzeComplaint should extract JSON from responses with surrounding text', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 500 }),
        fc.record({
          category: fc.constantFrom(...aiService.VALID_CATEGORIES),
          severity: fc.constantFrom(...aiService.VALID_SEVERITIES),
          department: fc.string({ minLength: 5, maxLength: 50 })
        }),
        async (description, mockAiResponse) => {
          // Mock response with surrounding text
          const responseWithText = `Here is the analysis:\n${JSON.stringify(mockAiResponse)}\nHope this helps!`;
          
          axios.post.mockResolvedValueOnce({
            data: {
              choices: [
                {
                  message: {
                    content: responseWithText
                  }
                }
              ]
            }
          });

          const result = await aiService.analyzeComplaint(description);

          // Property: Should extract JSON correctly
          expect(result.category).toBe(mockAiResponse.category);
          expect(result.severity).toBe(mockAiResponse.severity);
          expect(result.department).toBe(mockAiResponse.department);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: AI service should use fallback for invalid categories
  test('analyzeComplaint should use fallback category when AI returns invalid category', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 500 }),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !aiService.VALID_CATEGORIES.includes(s)),
        fc.constantFrom(...aiService.VALID_SEVERITIES),
        fc.string({ minLength: 5, maxLength: 50 }),
        async (description, invalidCategory, validSeverity, department) => {
          // Mock response with invalid category
          axios.post.mockResolvedValueOnce({
            data: {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      category: invalidCategory,
                      severity: validSeverity,
                      department: department
                    })
                  }
                }
              ]
            }
          });

          const result = await aiService.analyzeComplaint(description);

          // Property: Should use fallback category
          expect(aiService.VALID_CATEGORIES).toContain(result.category);
          expect(result.category).toBe('garbage'); // Default fallback
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: AI service should use fallback for invalid severity
  test('analyzeComplaint should use fallback severity when AI returns invalid severity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 500 }),
        fc.constantFrom(...aiService.VALID_CATEGORIES),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => !aiService.VALID_SEVERITIES.includes(s)),
        fc.string({ minLength: 5, maxLength: 50 }),
        async (description, validCategory, invalidSeverity, department) => {
          // Mock response with invalid severity
          axios.post.mockResolvedValueOnce({
            data: {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      category: validCategory,
                      severity: invalidSeverity,
                      department: department
                    })
                  }
                }
              ]
            }
          });

          const result = await aiService.analyzeComplaint(description);

          // Property: Should use fallback severity
          expect(aiService.VALID_SEVERITIES).toContain(result.severity);
          expect(result.severity).toBe('medium'); // Default fallback
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property: AI service should reject invalid input
  test('analyzeComplaint should throw error for invalid description input', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant(''),
          fc.integer(),
          fc.object()
        ),
        async (invalidInput) => {
          // Property: Should throw error for invalid input
          await expect(aiService.analyzeComplaint(invalidInput)).rejects.toThrow('Invalid complaint description');
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property: AI service should throw error when API returns empty response
  test('analyzeComplaint should throw error when Groq API returns empty content', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 500 }),
        async (description) => {
          // Mock empty response
          axios.post.mockResolvedValueOnce({
            data: {
              choices: [
                {
                  message: {
                    content: ''
                  }
                }
              ]
            }
          });

          // Property: Should throw error for empty response
          await expect(aiService.analyzeComplaint(description)).rejects.toThrow('Empty response from Groq API');
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property: AI service should throw error when response is missing required fields
  test('analyzeComplaint should throw error when response missing required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 500 }),
        fc.oneof(
          fc.constant({ severity: 'high', department: 'Roads' }), // Missing category
          fc.constant({ category: 'pothole', department: 'Roads' }), // Missing severity
          fc.constant({ category: 'pothole', severity: 'high' }) // Missing department
        ),
        async (description, incompleteResponse) => {
          // Mock incomplete response
          axios.post.mockResolvedValueOnce({
            data: {
              choices: [
                {
                  message: {
                    content: JSON.stringify(incompleteResponse)
                  }
                }
              ]
            }
          });

          // Property: Should throw error for missing fields
          await expect(aiService.analyzeComplaint(description)).rejects.toThrow('AI response missing required fields');
        }
      ),
      { numRuns: 50 }
    );
  });
});
