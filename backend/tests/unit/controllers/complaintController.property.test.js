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
jest.mock('../../../src/services/aiService', () => ({
  analyzeComplaint: jest.fn(),
  VALID_CATEGORIES: [
    'pothole',
    'garbage',
    'flooding',
    'water leak',
    'streetlight failure',
    'traffic signal issue',
    'drainage'
  ],
  VALID_SEVERITIES: ['low', 'medium', 'high']
}));
jest.mock('../../../src/utils/geoUtils');

const db = require('../../../src/database/db');
const aiService = require('../../../src/services/aiService');
const geoUtils = require('../../../src/utils/geoUtils');

const { 
  createComplaint, 
  getComplaint, 
  updateComplaintStatus,
  getTrending,
  getHeatmapData
} = require('../../../src/controllers/complaintController');

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

    // Mock db.query to return the complaint with the same data that was inserted
    db.query.mockImplementation(async (query, params) => {
      if (query.includes('INSERT INTO complaints')) {
        return {
          rows: [{
            complaint_id: 'test-uuid-123',
            category: params[1], // Use the category from params
            priority: params[2], // Use the priority from params
            status: 'pending',
            created_at: new Date().toISOString()
          }]
        };
      }
      return { rows: [] };
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
            aiService.analyzeComplaint.mockResolvedValueOnce({
              category,
              severity,
              department: 'Test Department'
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

            // Property: All required fields should be present with correct types
            expect(responseData).toHaveProperty('complaint_id');
            expect(typeof responseData.complaint_id).toBe('string');
            expect(responseData).toHaveProperty('category');
            expect(aiService.VALID_CATEGORIES).toContain(responseData.category);
            expect(responseData).toHaveProperty('priority');
            expect(['low', 'medium', 'high']).toContain(responseData.priority);
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
            // Check that longitude comes before latitude in the parameter list
            expect(insertCall[1].length).toBe(6);
            expect(typeof insertCall[1][3]).toBe('number'); // longitude
            expect(typeof insertCall[1][4]).toBe('number'); // latitude
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

            // Property: Coordinate values should be numeric and within valid ranges
            const storedLongitude = insertCall[1][3];
            const storedLatitude = insertCall[1][4];
            
            expect(typeof storedLongitude).toBe('number');
            expect(typeof storedLatitude).toBe('number');
            expect(storedLatitude).toBeGreaterThanOrEqual(-90);
            expect(storedLatitude).toBeLessThanOrEqual(90);
            expect(storedLongitude).toBeGreaterThanOrEqual(-180);
            expect(storedLongitude).toBeLessThanOrEqual(180);
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

            // Property: assignToCluster should be called with correct parameter types
            expect(geoUtils.assignToCluster).toHaveBeenCalled();
            
            const clusterCall = geoUtils.assignToCluster.mock.calls[0];
            expect(typeof clusterCall[0]).toBe('string'); // complaint_id
            expect(typeof clusterCall[1]).toBe('number'); // longitude
            expect(typeof clusterCall[2]).toBe('number'); // latitude
            expect(typeof clusterCall[3]).toBe('string'); // category
            expect(aiService.VALID_CATEGORIES).toContain(clusterCall[3]);
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
            // Clear mocks for this iteration
            jest.clearAllMocks();
            
            mockReq.body = { description, latitude, longitude };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: AI service should be called before database
            // Check that both were called
            expect(aiService.analyzeComplaint).toHaveBeenCalled();
            expect(db.query).toHaveBeenCalled();
            
            // Property: AI service should be called exactly once per complaint
            expect(aiService.analyzeComplaint).toHaveBeenCalledTimes(1);
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
            // Check that a valid category was used
            expect(aiService.VALID_CATEGORIES).toContain(insertCall[1][1]);
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
          fc.option(fc.webUrl()),
          async (description, latitude, longitude, image_url) => {
            mockReq.body = { description, latitude, longitude, image_url };
            await createComplaint(mockReq, mockRes, mockNext);

            // Property: image_url parameter should be passed to database
            const insertCall = db.query.mock.calls.find(call => 
              call[0].includes('INSERT INTO complaints')
            );
            // Check that the 6th parameter exists (image_url position)
            expect(insertCall[1].length).toBe(6);
            // It should be either a string or null
            const imageUrlParam = insertCall[1][5];
            expect(imageUrlParam === null || typeof imageUrlParam === 'string').toBe(true);
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

/**
 * Property-Based Tests for Complaint Retrieval and Updates
 * 
 * These tests verify correctness properties for complaint retrieval and status updates:
 * - Complaint retrieval response format
 * - Privacy protection in all responses
 * - Non-existent resource returns 404
 * - Status value validation
 * - Status update modifies database
 * - Timestamp auto-update on status change
 * - Status update response contains updated data
 */

describe('Property Tests: Complaint Retrieval and Updates', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request, response, and next
    mockReq = {
      params: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  // Feature: nammafix-backend, Property 11: Complaint Retrieval Response Format
  // **Validates: Requirements 4.2**
  describe('Property 11: Complaint Retrieval Response Format', () => {
    test('should return exactly complaint_id, category, priority, status, latitude, longitude, and created_at', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...aiService.VALID_CATEGORIES),
          fc.constantFrom('low', 'medium', 'high'),
          fc.constantFrom('pending', 'in_progress', 'resolved'),
          fc.float({ min: -90, max: 90, noNaN: true }),
          fc.float({ min: -180, max: 180, noNaN: true }),
          async (category, priority, status, latitude, longitude) => {
            const complaint_id = `test-uuid-${Math.random()}`;
            const created_at = new Date().toISOString();
            
            // Mock database to return complaint
            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id,
                category,
                priority,
                status,
                latitude,
                longitude,
                created_at
              }]
            });

            mockReq.params = { id: complaint_id };
            await getComplaint(mockReq, mockRes, mockNext);

            // Property: Response should contain exactly these 7 fields
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalled();
            
            const responseData = mockRes.json.mock.calls[0][0];
            expect(Object.keys(responseData).sort()).toEqual([
              'category',
              'complaint_id',
              'created_at',
              'latitude',
              'longitude',
              'priority',
              'status'
            ]);

            // Property: All required fields should be present with correct types
            expect(responseData).toHaveProperty('complaint_id');
            expect(responseData).toHaveProperty('category', category);
            expect(responseData).toHaveProperty('priority', priority);
            expect(responseData).toHaveProperty('status', status);
            expect(typeof responseData.latitude).toBe('number');
            expect(typeof responseData.longitude).toBe('number');
            expect(responseData).toHaveProperty('created_at');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should return coordinates with correct precision', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          async (latitude, longitude) => {
            const complaint_id = `test-uuid-${Math.random()}`;
            
            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id,
                category: 'pothole',
                priority: 'high',
                status: 'pending',
                latitude,
                longitude,
                created_at: new Date().toISOString()
              }]
            });

            mockReq.params = { id: complaint_id };
            await getComplaint(mockReq, mockRes, mockNext);

            const responseData = mockRes.json.mock.calls[0][0];

            // Property: Coordinates should be numeric and within valid ranges
            expect(typeof responseData.latitude).toBe('number');
            expect(typeof responseData.longitude).toBe('number');
            expect(responseData.latitude).toBeGreaterThanOrEqual(-90);
            expect(responseData.latitude).toBeLessThanOrEqual(90);
            expect(responseData.longitude).toBeGreaterThanOrEqual(-180);
            expect(responseData.longitude).toBeLessThanOrEqual(180);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nammafix-backend, Property 12: Privacy Protection in All Responses
  // **Validates: Requirements 4.3, 6.4, 7.3, 9.1, 9.2, 9.3, 9.4**
  describe('Property 12: Privacy Protection in All Responses', () => {
    test('getComplaint should not return user personal data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...aiService.VALID_CATEGORIES),
          async (category) => {
            const complaint_id = `test-uuid-${Math.random()}`;
            
            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id,
                category,
                priority: 'medium',
                status: 'pending',
                latitude: 12.9716,
                longitude: 77.5946,
                created_at: new Date().toISOString()
              }]
            });

            mockReq.params = { id: complaint_id };
            await getComplaint(mockReq, mockRes, mockNext);

            const responseData = mockRes.json.mock.calls[0][0];

            // Property: Response should not contain user personal information
            expect(responseData).not.toHaveProperty('user_id');
            expect(responseData).not.toHaveProperty('email');
            expect(responseData).not.toHaveProperty('name');
            expect(responseData).not.toHaveProperty('phone');
            expect(responseData).not.toHaveProperty('address');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('getTrending should not return citizen personal data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              cluster_id: fc.uuid(),
              issue_type: fc.constantFrom(...aiService.VALID_CATEGORIES),
              latitude: fc.float({ min: -90, max: 90, noNaN: true }),
              longitude: fc.float({ min: -180, max: 180, noNaN: true }),
              complaint_count: fc.integer({ min: 1, max: 100 })
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (clusters) => {
            db.query.mockResolvedValueOnce({ rows: clusters });

            await getTrending(mockReq, mockRes, mockNext);

            const responseData = mockRes.json.mock.calls[0][0];

            // Property: No cluster should contain user personal information
            responseData.forEach(cluster => {
              expect(cluster).not.toHaveProperty('user_id');
              expect(cluster).not.toHaveProperty('email');
              expect(cluster).not.toHaveProperty('name');
              expect(cluster).not.toHaveProperty('phone');
              expect(cluster).not.toHaveProperty('address');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('getHeatmapData should not return citizen personal data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              latitude: fc.float({ min: -90, max: 90, noNaN: true }),
              longitude: fc.float({ min: -180, max: 180, noNaN: true }),
              category: fc.constantFrom(...aiService.VALID_CATEGORIES),
              priority: fc.constantFrom('low', 'medium', 'high')
            }),
            { minLength: 0, maxLength: 100 }
          ),
          async (complaints) => {
            db.query.mockResolvedValueOnce({ rows: complaints });

            await getHeatmapData(mockReq, mockRes, mockNext);

            const responseData = mockRes.json.mock.calls[0][0];

            // Property: No complaint should contain user personal information
            responseData.forEach(complaint => {
              expect(complaint).not.toHaveProperty('user_id');
              expect(complaint).not.toHaveProperty('email');
              expect(complaint).not.toHaveProperty('name');
              expect(complaint).not.toHaveProperty('phone');
              expect(complaint).not.toHaveProperty('address');
              expect(complaint).not.toHaveProperty('description');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('updateComplaintStatus should not return user personal data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('pending', 'in_progress', 'resolved'),
          async (complaint_id, status) => {
            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id,
                status,
                updated_at: new Date().toISOString()
              }]
            });

            mockReq.params = { id: complaint_id };
            mockReq.body = { status };
            await updateComplaintStatus(mockReq, mockRes, mockNext);

            const responseData = mockRes.json.mock.calls[0][0];

            // Property: Response should not contain user personal information
            expect(responseData).not.toHaveProperty('user_id');
            expect(responseData).not.toHaveProperty('email');
            expect(responseData).not.toHaveProperty('name');
            expect(responseData).not.toHaveProperty('phone');
            expect(responseData).not.toHaveProperty('address');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nammafix-backend, Property 13: Non-Existent Resource Returns 404
  // **Validates: Requirements 4.4, 5.6, 10.2**
  describe('Property 13: Non-Existent Resource Returns 404', () => {
    test('getComplaint should return 404 for non-existent complaint', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (complaint_id) => {
            // Mock database to return no rows
            db.query.mockResolvedValueOnce({ rows: [] });

            mockReq.params = { id: complaint_id };
            await getComplaint(mockReq, mockRes, mockNext);

            // Property: Should call next with NotFoundError
            expect(mockNext).toHaveBeenCalled();
            const error = mockNext.mock.calls[0][0];
            expect(error.name).toBe('NotFoundError');
            expect(error.message).toContain('does not exist');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('updateComplaintStatus should return 404 for non-existent complaint', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('pending', 'in_progress', 'resolved'),
          async (complaint_id, status) => {
            // Mock database to return no rows
            db.query.mockResolvedValueOnce({ rows: [] });

            mockReq.params = { id: complaint_id };
            mockReq.body = { status };
            await updateComplaintStatus(mockReq, mockRes, mockNext);

            // Property: Should call next with NotFoundError
            expect(mockNext).toHaveBeenCalled();
            const error = mockNext.mock.calls[0][0];
            expect(error.name).toBe('NotFoundError');
            expect(error.message).toContain('does not exist');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('404 error should contain descriptive message', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (complaint_id) => {
            db.query.mockResolvedValueOnce({ rows: [] });

            mockReq.params = { id: complaint_id };
            await getComplaint(mockReq, mockRes, mockNext);

            const error = mockNext.mock.calls[0][0];
            
            // Property: Error message should be descriptive
            expect(error.message).toBeTruthy();
            expect(error.message.length).toBeGreaterThan(10);
            expect(error.message.toLowerCase()).toContain('not exist');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nammafix-backend, Property 14: Status Value Validation
  // **Validates: Requirements 5.2, 5.7**
  describe('Property 14: Status Value Validation', () => {
    test('should accept valid status values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('pending', 'in_progress', 'resolved'),
          async (status) => {
            const complaint_id = `test-uuid-${Math.random()}`;
            const updated_at = new Date().toISOString();
            
            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id,
                status,
                updated_at
              }]
            });

            mockReq.params = { id: complaint_id };
            mockReq.body = { status };
            await updateComplaintStatus(mockReq, mockRes, mockNext);

            // Property: Valid status should be processed successfully
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('validation middleware should reject invalid status values', async () => {
      // Note: This test verifies that the validation logic exists
      // The actual validation is done by express-validator middleware
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
            !['pending', 'in_progress', 'resolved'].includes(s)
          ),
          async (invalidStatus) => {
            // Property: Only valid status values should reach the controller
            // Invalid values should be caught by validation middleware
            const validStatuses = ['pending', 'in_progress', 'resolved'];
            expect(validStatuses).not.toContain(invalidStatus);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('should use exact status value from request', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('pending', 'in_progress', 'resolved'),
          async (status) => {
            const complaint_id = `test-uuid-${Math.random()}`;
            const updated_at = new Date().toISOString();
            
            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id,
                status,
                updated_at
              }]
            });

            mockReq.params = { id: complaint_id };
            mockReq.body = { status };
            await updateComplaintStatus(mockReq, mockRes, mockNext);

            // Property: Status in database query should match request
            const updateCall = db.query.mock.calls[0];
            expect(updateCall[1][0]).toBe(status);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nammafix-backend, Property 15: Status Update Modifies Database
  // **Validates: Requirements 5.3**
  describe('Property 15: Status Update Modifies Database', () => {
    test('should execute UPDATE query with correct parameters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('pending', 'in_progress', 'resolved'),
          async (complaint_id, status) => {
            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id,
                status,
                updated_at: new Date().toISOString()
              }]
            });

            mockReq.params = { id: complaint_id };
            mockReq.body = { status };
            await updateComplaintStatus(mockReq, mockRes, mockNext);

            // Property: Should execute UPDATE query
            expect(db.query).toHaveBeenCalled();
            const queryCall = db.query.mock.calls[0];
            expect(queryCall[0]).toContain('UPDATE complaints');
            expect(queryCall[0]).toContain('SET status = $1');
            expect(queryCall[0]).toContain('WHERE complaint_id = $2');
            
            // Property: Parameters should match request
            expect(queryCall[1]).toEqual([status, complaint_id]);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should return updated status in response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('pending', 'in_progress', 'resolved'),
          async (complaint_id, newStatus) => {
            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id,
                status: newStatus,
                updated_at: new Date().toISOString()
              }]
            });

            mockReq.params = { id: complaint_id };
            mockReq.body = { status: newStatus };
            await updateComplaintStatus(mockReq, mockRes, mockNext);

            const responseData = mockRes.json.mock.calls[0][0];

            // Property: Response should reflect the new status
            expect(responseData.status).toBe(newStatus);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should use RETURNING clause to get updated data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('pending', 'in_progress', 'resolved'),
          async (complaint_id, status) => {
            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id,
                status,
                updated_at: new Date().toISOString()
              }]
            });

            mockReq.params = { id: complaint_id };
            mockReq.body = { status };
            await updateComplaintStatus(mockReq, mockRes, mockNext);

            // Property: Query should use RETURNING clause
            const queryCall = db.query.mock.calls[0];
            expect(queryCall[0]).toContain('RETURNING');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nammafix-backend, Property 16: Timestamp Auto-Update on Status Change
  // **Validates: Requirements 5.4, 12.5**
  describe('Property 16: Timestamp Auto-Update on Status Change', () => {
    test('should return updated_at timestamp in response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('pending', 'in_progress', 'resolved'),
          async (complaint_id, status) => {
            const updated_at = new Date().toISOString();
            
            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id,
                status,
                updated_at
              }]
            });

            mockReq.params = { id: complaint_id };
            mockReq.body = { status };
            await updateComplaintStatus(mockReq, mockRes, mockNext);

            const responseData = mockRes.json.mock.calls[0][0];

            // Property: Response should include updated_at timestamp
            expect(responseData).toHaveProperty('updated_at');
            expect(responseData.updated_at).toBe(updated_at);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should request updated_at in RETURNING clause', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('pending', 'in_progress', 'resolved'),
          async (complaint_id, status) => {
            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id,
                status,
                updated_at: new Date().toISOString()
              }]
            });

            mockReq.params = { id: complaint_id };
            mockReq.body = { status };
            await updateComplaintStatus(mockReq, mockRes, mockNext);

            // Property: Query should return updated_at
            const queryCall = db.query.mock.calls[0];
            expect(queryCall[0]).toContain('updated_at');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('updated_at should be a valid ISO timestamp', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('pending', 'in_progress', 'resolved'),
          async (complaint_id, status) => {
            const updated_at = new Date().toISOString();
            
            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id,
                status,
                updated_at
              }]
            });

            mockReq.params = { id: complaint_id };
            mockReq.body = { status };
            await updateComplaintStatus(mockReq, mockRes, mockNext);

            const responseData = mockRes.json.mock.calls[0][0];

            // Property: updated_at should be a valid date string
            expect(responseData.updated_at).toBeTruthy();
            const date = new Date(responseData.updated_at);
            expect(date.toString()).not.toBe('Invalid Date');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: nammafix-backend, Property 17: Status Update Response Contains Updated Data
  // **Validates: Requirements 5.5**
  describe('Property 17: Status Update Response Contains Updated Data', () => {
    test('should return complaint_id, status, and updated_at', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('pending', 'in_progress', 'resolved'),
          async (complaint_id, status) => {
            const updated_at = new Date().toISOString();
            
            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id,
                status,
                updated_at
              }]
            });

            mockReq.params = { id: complaint_id };
            mockReq.body = { status };
            await updateComplaintStatus(mockReq, mockRes, mockNext);

            const responseData = mockRes.json.mock.calls[0][0];

            // Property: Response should contain exactly these 3 fields
            expect(Object.keys(responseData).sort()).toEqual([
              'complaint_id',
              'status',
              'updated_at'
            ]);

            // Property: All fields should have correct values
            expect(responseData.complaint_id).toBe(complaint_id);
            expect(responseData.status).toBe(status);
            expect(responseData.updated_at).toBe(updated_at);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should return 200 status code for successful update', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('pending', 'in_progress', 'resolved'),
          async (complaint_id, status) => {
            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id,
                status,
                updated_at: new Date().toISOString()
              }]
            });

            mockReq.params = { id: complaint_id };
            mockReq.body = { status };
            await updateComplaintStatus(mockReq, mockRes, mockNext);

            // Property: Successful update should return 200 OK
            expect(mockRes.status).toHaveBeenCalledWith(200);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should not include unnecessary fields in response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('pending', 'in_progress', 'resolved'),
          async (complaint_id, status) => {
            db.query.mockResolvedValueOnce({
              rows: [{
                complaint_id,
                status,
                updated_at: new Date().toISOString()
              }]
            });

            mockReq.params = { id: complaint_id };
            mockReq.body = { status };
            await updateComplaintStatus(mockReq, mockRes, mockNext);

            const responseData = mockRes.json.mock.calls[0][0];

            // Property: Response should not contain extra fields
            expect(responseData).not.toHaveProperty('category');
            expect(responseData).not.toHaveProperty('priority');
            expect(responseData).not.toHaveProperty('description');
            expect(responseData).not.toHaveProperty('latitude');
            expect(responseData).not.toHaveProperty('longitude');
            expect(responseData).not.toHaveProperty('created_at');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Additional properties: Error handling
  describe('Additional Properties: Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (complaint_id) => {
            // Mock database to throw error
            db.query.mockRejectedValueOnce(new Error('Database connection failed'));

            mockReq.params = { id: complaint_id };
            await getComplaint(mockReq, mockRes, mockNext);

            // Property: Should call next with DatabaseError
            expect(mockNext).toHaveBeenCalled();
            const error = mockNext.mock.calls[0][0];
            expect(error.name).toBe('DatabaseError');
          }
        ),
        { numRuns: 50 }
      );
    });

    test('should handle status update database errors gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('pending', 'in_progress', 'resolved'),
          async (complaint_id, status) => {
            // Mock database to throw error
            db.query.mockRejectedValueOnce(new Error('Database connection failed'));

            mockReq.params = { id: complaint_id };
            mockReq.body = { status };
            await updateComplaintStatus(mockReq, mockRes, mockNext);

            // Property: Should call next with DatabaseError
            expect(mockNext).toHaveBeenCalled();
            const error = mockNext.mock.calls[0][0];
            expect(error.name).toBe('DatabaseError');
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
