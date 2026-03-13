const fc = require('fast-check');

// Mock dependencies before importing
jest.mock('../../../src/config/env', () => ({
  database: {
    url: 'postgresql://test:test@localhost:5432/test'
  },
  supabase: {
    url: 'https://test.supabase.co',
    anonKey: 'test-anon-key'
  },
  groq: {
    apiKey: 'test-groq-key'
  },
  server: {
    port: 3000
  }
}));
jest.mock('../../../src/config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}));
jest.mock('../../../src/database/db');
jest.mock('../../../src/services/aiService');
jest.mock('../../../src/utils/geoUtils');

const db = require('../../../src/database/db');
const aiService = require('../../../src/services/aiService');
const geoUtils = require('../../../src/utils/geoUtils');

const { createComplaint } = require('../../../src/controllers/complaintController');

/**
 * Property-Based Tests for Complaint Creation
 * 
 * These tests verify correctness properties for the complaint submission workflow:
 * - Severity to priority mapping
 * - Initial status assignment
 * - Response format
 * - Coordinate preservation
 * - Duplicate detection
 * - Cluster assignment
 */

describe('Property Tests: Complaint Creation', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request, response, and next
    mockReq = {
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();

    // Default mock implementations
    aiService.analyzeComplaint.mockResolvedValue({
      category: 'pothole',
      severity: 'high',
      department: 'Roads and Infrastructure'
    });

    db.query.mockResolvedValue({
      rows: [{
        complaint_id: 'test-uuid-123',
        category: 'pothole',
        priority: 'high',
        status: 'pending',
        created_at: new Date().toISOString()
      }]
    });

    geoUtils.assignToCluster.mockResolvedValue('cluster-uuid-456');
  });

  // Feature: nammafix-backend, Property 2: Severity to Priority Mapping
  // **Validates: Requirements 3.10**
  describe('Property 2: Severity to Priority Mapping', () => {
    test('should map high severity to high priority', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            // Mock AI service to return high severity
            aiService.analyzeComplaint.mockResolvedValueOnce({
              category: 'pothole',
              severity: 'high',
              department: 'Roads'
            });

            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: High severity should map to high priority
            const insertCall = db.query.mock.calls.find(call => 
              call[0].includes('INSERT INTO complaints')
            );
            expect(insertCall[1][2]).toBe('high'); // priority parameter
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should map medium severity to medium priority', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            // Mock AI service to return medium severity
            aiService.analyzeComplaint.mockResolvedValueOnce({
              category: 'garbage',
              severity: 'medium',
              department: 'Waste Management'
            });

            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: Medium severity should map to medium priority
            const insertCall = db.query.mock.calls.find(call => 
              call[0].includes('INSERT INTO complaints')
            );
            expect(insertCall[1][2]).toBe('medium'); // priority parameter
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should map low severity to low priority', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            // Mock AI service to return low severity
            aiService.analyzeComplaint.mockResolvedValueOnce({
              category: 'streetlight failure',
              severity: 'low',
              department: 'Electricity'
            });

            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: Low severity should map to low priority
            const insertCall = db.query.mock.calls.find(call => 
              call[0].includes('INSERT INTO complaints')
            );
            expect(insertCall[1][2]).toBe('low'); // priority parameter
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should use medium priority as default for unknown severity', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
            !['low', 'medium', 'high'].includes(s)
          ),
          async (description, latitude, longitude, unknownSeverity) => {
            // Mock AI service to return unknown severity
            aiService.analyzeComplaint.mockResolvedValueOnce({
              category: 'pothole',
              severity: unknownSeverity,
              department: 'Roads'
            });

            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: Unknown severity should default to medium priority
            const insertCall = db.query.mock.calls.find(call => 
              call[0].includes('INSERT INTO complaints')
            );
            expect(insertCall[1][2]).toBe('medium'); // priority parameter
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: nammafix-backend, Property 8: New Complaints Start as Pending
  // **Validates: Requirements 3.12**
  describe('Property 8: New Complaints Start as Pending', () => {
    test('should set initial status to pending for all new complaints', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          fc.constantFrom(...aiService.VALID_CATEGORIES),
          fc.constantFrom(...aiService.VALID_SEVERITIES),
          async (description, latitude, longitude, category, severity) => {
            // Mock AI service with random valid category and severity
            aiService.analyzeComplaint.mockResolvedValueOnce({
              category,
              severity,
              department: 'Test Department'
            });

            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: Status should always be 'pending' in INSERT query
            const insertCall = db.query.mock.calls.find(call => 
              call[0].includes('INSERT INTO complaints')
            );
            expect(insertCall[0]).toContain("'pending'");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nammafix-backend, Property 9: Complaint Submission Response Format
  // **Validates: Requirements 3.13**
  describe('Property 9: Complaint Submission Response Format', () => {
    test('should return exactly complaint_id, category, priority, and status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          fc.constantFrom(...aiService.VALID_CATEGORIES),
          fc.constantFrom(...aiService.VALID_SEVERITIES),
          async (description, latitude, longitude, category, severity) => {
            const mockComplaintId = `uuid-${Math.random()}`;
            
            aiService.analyzeComplaint.mockResolvedValueOnce({
              category,
              severity,
              department: 'Test Department'
            });

            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id: mockComplaintId,
                category,
                priority: severity,
                status: 'pending',
                created_at: new Date().toISOString()
              }]
            });

            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: Response should contain exactly these 4 fields
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalled();
            
            const responseData = mockRes.json.mock.calls[0][0];
            expect(Object.keys(responseData).sort()).toEqual([
              'category',
              'complaint_id',
              'priority',
              'status'
            ]);

            // Property: All required fields should be present
            expect(responseData).toHaveProperty('complaint_id', mockComplaintId);
            expect(responseData).toHaveProperty('category', category);
            expect(responseData).toHaveProperty('priority');
            expect(responseData).toHaveProperty('status', 'pending');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should not include user data or coordinates in response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            const responseData = mockRes.json.mock.calls[0][0];

            // Property: Response should not contain sensitive or unnecessary data
            expect(responseData).not.toHaveProperty('user_id');
            expect(responseData).not.toHaveProperty('email');
            expect(responseData).not.toHaveProperty('name');
            expect(responseData).not.toHaveProperty('latitude');
            expect(responseData).not.toHaveProperty('longitude');
            expect(responseData).not.toHaveProperty('description');
            expect(responseData).not.toHaveProperty('created_at');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nammafix-backend, Property 10: Coordinate Round-Trip Preservation
  // **Validates: Requirements 12.4**
  describe('Property 10: Coordinate Round-Trip Preservation', () => {
    test('should store coordinates in correct order (longitude, latitude)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: Coordinates should be passed to ST_MakePoint in (longitude, latitude) order
            const insertCall = db.query.mock.calls.find(call => 
              call[0].includes('INSERT INTO complaints')
            );
            
            // Parameters: [description, category, priority, longitude, latitude, image_url]
            expect(insertCall[1][3]).toBe(longitude); // 4th parameter
            expect(insertCall[1][4]).toBe(latitude);  // 5th parameter
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should preserve coordinate precision', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          // Generate coordinates with high precision
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            const insertCall = db.query.mock.calls.find(call => 
              call[0].includes('INSERT INTO complaints')
            );

            // Property: Exact coordinate values should be preserved
            expect(insertCall[1][3]).toBe(longitude);
            expect(insertCall[1][4]).toBe(latitude);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nammafix-backend, Property 21: Duplicate Detection Within Radius
  // **Validates: Requirements 8.1**
  describe('Property 21: Duplicate Detection Within Radius', () => {
    test('should check for nearby complaints with matching category', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          fc.constantFrom(...aiService.VALID_CATEGORIES),
          async (description, latitude, longitude, category) => {
            aiService.analyzeComplaint.mockResolvedValueOnce({
              category,
              severity: 'medium',
              department: 'Test Department'
            });

            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: assignToCluster should be called with correct parameters
            expect(geoUtils.assignToCluster).toHaveBeenCalled();
            
            const clusterCall = geoUtils.assignToCluster.mock.calls[0];
            expect(clusterCall[1]).toBe(longitude); // longitude parameter
            expect(clusterCall[2]).toBe(latitude);  // latitude parameter
            expect(clusterCall[3]).toBe(category);  // category parameter
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should call assignToCluster asynchronously after complaint creation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: Response should be sent before cluster assignment completes
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalled();
            
            // Property: assignToCluster should be called (but not awaited)
            expect(geoUtils.assignToCluster).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nammafix-backend, Property 22: Cluster Assignment for Nearby Matches
  // **Validates: Requirements 8.3, 8.6**
  describe('Property 22: Cluster Assignment for Nearby Matches', () => {
    test('should assign complaint to cluster when nearby match exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          fc.constantFrom(...aiService.VALID_CATEGORIES),
          async (description, latitude, longitude, category) => {
            const mockComplaintId = `uuid-${Math.random()}`;
            const mockClusterId = `cluster-${Math.random()}`;

            aiService.analyzeComplaint.mockResolvedValueOnce({
              category,
              severity: 'medium',
              department: 'Test Department'
            });

            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id: mockComplaintId,
                category,
                priority: 'medium',
                status: 'pending',
                created_at: new Date().toISOString()
              }]
            });

            geoUtils.assignToCluster.mockResolvedValueOnce(mockClusterId);

            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: assignToCluster should be called with complaint_id
            expect(geoUtils.assignToCluster).toHaveBeenCalledWith(
              mockComplaintId,
              longitude,
              latitude,
              category
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should handle cluster assignment for all valid categories', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          fc.constantFrom(...aiService.VALID_CATEGORIES),
          async (description, latitude, longitude, category) => {
            aiService.analyzeComplaint.mockResolvedValueOnce({
              category,
              severity: 'medium',
              department: 'Test Department'
            });

            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: Cluster assignment should work for any valid category
            const clusterCall = geoUtils.assignToCluster.mock.calls[0];
            expect(aiService.VALID_CATEGORIES).toContain(clusterCall[3]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nammafix-backend, Property 23: New Cluster for Distant or Different Category
  // **Validates: Requirements 8.4**
  describe('Property 23: New Cluster for Distant or Different Category', () => {
    test('should call assignToCluster regardless of distance or category', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          fc.constantFrom(...aiService.VALID_CATEGORIES),
          async (description, latitude, longitude, category) => {
            aiService.analyzeComplaint.mockResolvedValueOnce({
              category,
              severity: 'medium',
              department: 'Test Department'
            });

            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: assignToCluster should always be called
            // The logic for creating new cluster vs joining existing is in geoUtils
            expect(geoUtils.assignToCluster).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should delegate cluster creation logic to geoUtils', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: Controller should not contain cluster creation logic
            // It should delegate to geoUtils.assignToCluster
            expect(geoUtils.assignToCluster).toHaveBeenCalled();
            
            // Property: No direct cluster INSERT queries in controller
            const allQueries = db.query.mock.calls.map(call => call[0]);
            const hasClusterInsert = allQueries.some(query => 
              query.includes('INSERT INTO clusters')
            );
            expect(hasClusterInsert).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nammafix-backend, Property 24: Cluster Count Increment
  // **Validates: Requirements 8.5**
  describe('Property 24: Cluster Count Increment', () => {
    test('should call assignToCluster which handles count increment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: assignToCluster is responsible for incrementing count
            expect(geoUtils.assignToCluster).toHaveBeenCalled();
            
            // Property: Controller should not directly update cluster counts
            const allQueries = db.query.mock.calls.map(call => call[0]);
            const hasCountUpdate = allQueries.some(query => 
              query.includes('UPDATE clusters') && query.includes('complaint_count')
            );
            expect(hasCountUpdate).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should not fail complaint creation if cluster assignment fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            // Mock cluster assignment to fail
            geoUtils.assignToCluster.mockRejectedValueOnce(
              new Error('Cluster assignment failed')
            );

            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: Complaint should still be created successfully
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalled();
            
            // Property: Error should not propagate to client
            expect(mockNext).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Additional property: Workflow integration
  describe('Additional Properties: Workflow Integration', () => {
    test('should call AI service before database insertion', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            let aiServiceCallTime;
            let dbQueryCallTime;

            aiService.analyzeComplaint.mockImplementationOnce(async () => {
              aiServiceCallTime = Date.now();
              return {
                category: 'pothole',
                severity: 'high',
                department: 'Roads'
              };
            });

            db.query.mockImplementationOnce(async () => {
              dbQueryCallTime = Date.now();
              return {
                rows: [{
                  complaint_id: 'test-uuid',
                  category: 'pothole',
                  priority: 'high',
                  status: 'pending',
                  created_at: new Date().toISOString()
                }]
              };
            });

            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: AI service should be called before database
            expect(aiServiceCallTime).toBeLessThan(dbQueryCallTime);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('should use AI-extracted category in database insertion', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          fc.constantFrom(...aiService.VALID_CATEGORIES),
          async (description, latitude, longitude, category) => {
            aiService.analyzeComplaint.mockResolvedValueOnce({
              category,
              severity: 'medium',
              department: 'Test Department'
            });

            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: Category from AI should be used in INSERT
            const insertCall = db.query.mock.calls.find(call => 
              call[0].includes('INSERT INTO complaints')
            );
            expect(insertCall[1][1]).toBe(category); // category parameter
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should handle optional image_url parameter', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          fc.option(fc.webUrl(), { nil: null }),
          async (description, latitude, longitude, image_url) => {
            mockReq.body = { description, latitude, longitude, image_url };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: image_url should be passed to database (or null)
            const insertCall = db.query.mock.calls.find(call => 
              call[0].includes('INSERT INTO complaints')
            );
            expect(insertCall[1][5]).toBe(image_url || null); // image_url parameter
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should return 201 status code for successful creation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (description, latitude, longitude) => {
            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: Successful creation should return 201 Created
            expect(mockRes.status).toHaveBeenCalledWith(201);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
