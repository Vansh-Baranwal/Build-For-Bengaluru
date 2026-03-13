const request = require('supertest');
const app = require('../../../src/server');

// Mock the AI service to avoid actual API calls during tests
jest.mock('../../../src/services/aiService');
const aiService = require('../../../src/services/aiService');

// Mock the database to avoid actual database calls during tests
jest.mock('../../../src/database/db');
const db = require('../../../src/database/db');

describe('Complaint API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/complaints', () => {
    test('should create complaint with valid data and return 201', async () => {
      // Mock AI service response
      aiService.analyzeComplaint.mockResolvedValue({
        category: 'pothole',
        severity: 'high',
        department: 'Roads and Infrastructure'
      });

      // Mock database insert
      db.query.mockResolvedValue({
        rows: [{
          complaint_id: '123e4567-e89b-12d3-a456-426614174000',
          category: 'pothole',
          priority: 'high',
          status: 'pending',
          created_at: new Date()
        }]
      });

      const response = await request(app)
        .post('/api/complaints')
        .send({
          description: 'Large pothole on MG Road near Trinity Circle causing traffic issues',
          latitude: 12.9716,
          longitude: 77.5946,
          image_url: 'https://example.com/pothole.jpg'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('complaint_id');
      expect(response.body).toHaveProperty('category', 'pothole');
      expect(response.body).toHaveProperty('priority', 'high');
      expect(response.body).toHaveProperty('status', 'pending');
    });

    test('should reject complaint with short description (400)', async () => {
      const response = await request(app)
        .post('/api/complaints')
        .send({
          description: 'Short',
          latitude: 12.9716,
          longitude: 77.5946
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
      expect(response.body.details).toContain('Description must be between 10 and 500 characters');
    });

    test('should reject complaint with invalid latitude (400)', async () => {
      const response = await request(app)
        .post('/api/complaints')
        .send({
          description: 'Large pothole on MG Road near Trinity Circle',
          latitude: 95, // Invalid: > 90
          longitude: 77.5946
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
    });

    test('should reject complaint with invalid longitude (400)', async () => {
      const response = await request(app)
        .post('/api/complaints')
        .send({
          description: 'Large pothole on MG Road near Trinity Circle',
          latitude: 12.9716,
          longitude: 185 // Invalid: > 180
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
    });

    test('should reject complaint with invalid image format (400)', async () => {
      const response = await request(app)
        .post('/api/complaints')
        .send({
          description: 'Large pothole on MG Road near Trinity Circle',
          latitude: 12.9716,
          longitude: 77.5946,
          image_url: 'https://example.com/image.gif' // Invalid format
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
    });

    test('should enforce rate limiting (429)', async () => {
      // Mock AI and DB for successful requests
      aiService.analyzeComplaint.mockResolvedValue({
        category: 'pothole',
        severity: 'high',
        department: 'Roads'
      });

      db.query.mockResolvedValue({
        rows: [{
          complaint_id: '123e4567-e89b-12d3-a456-426614174000',
          category: 'pothole',
          priority: 'high',
          status: 'pending',
          created_at: new Date()
        }]
      });

      const validComplaint = {
        description: 'Test complaint for rate limiting check',
        latitude: 12.9716,
        longitude: 77.5946
      };

      // Make 5 requests (should succeed)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/complaints')
          .send({ ...validComplaint, description: `Test complaint ${i}` });
      }

      // 6th request should be rate limited
      const response = await request(app)
        .post('/api/complaints')
        .send(validComplaint);

      expect(response.status).toBe(429);
      expect(response.body.error).toBe('Too many requests');
    }, 15000); // Increase timeout for this test
  });

  describe('GET /api/complaints/:id', () => {
    test('should return complaint data for valid ID', async () => {
      const mockComplaint = {
        complaint_id: '123e4567-e89b-12d3-a456-426614174000',
        category: 'pothole',
        priority: 'high',
        status: 'pending',
        latitude: 12.9716,
        longitude: 77.5946,
        created_at: new Date()
      };

      db.query.mockResolvedValue({
        rows: [mockComplaint]
      });

      const response = await request(app)
        .get('/api/complaints/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('complaint_id');
      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('priority');
      expect(response.body).toHaveProperty('status');
      expect(response.body).not.toHaveProperty('user_name');
      expect(response.body).not.toHaveProperty('user_email');
    });

    test('should return 404 for non-existent complaint', async () => {
      db.query.mockResolvedValue({
        rows: []
      });

      const response = await request(app)
        .get('/api/complaints/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('NotFoundError');
    });

    test('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/complaints/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
    });
  });

  describe('PATCH /api/complaints/:id/status', () => {
    test('should update complaint status successfully', async () => {
      db.query.mockResolvedValue({
        rows: [{
          complaint_id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'in_progress',
          updated_at: new Date()
        }]
      });

      const response = await request(app)
        .patch('/api/complaints/123e4567-e89b-12d3-a456-426614174000/status')
        .send({ status: 'in_progress' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('complaint_id');
      expect(response.body).toHaveProperty('status', 'in_progress');
      expect(response.body).toHaveProperty('updated_at');
    });

    test('should reject invalid status value (400)', async () => {
      const response = await request(app)
        .patch('/api/complaints/123e4567-e89b-12d3-a456-426614174000/status')
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
    });

    test('should return 404 for non-existent complaint', async () => {
      db.query.mockResolvedValue({
        rows: []
      });

      const response = await request(app)
        .patch('/api/complaints/123e4567-e89b-12d3-a456-426614174000/status')
        .send({ status: 'resolved' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/trending', () => {
    test('should return trending clusters sorted by count', async () => {
      const mockClusters = [
        {
          cluster_id: '111',
          issue_type: 'pothole',
          latitude: 12.9716,
          longitude: 77.5946,
          complaint_count: 15
        },
        {
          cluster_id: '222',
          issue_type: 'garbage',
          latitude: 12.9800,
          longitude: 77.6000,
          complaint_count: 12
        }
      ];

      db.query.mockResolvedValue({
        rows: mockClusters
      });

      const response = await request(app)
        .get('/api/trending');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].complaint_count).toBeGreaterThanOrEqual(response.body[1].complaint_count);
    });
  });

  describe('GET /api/heatmap', () => {
    test('should return complaint locations for heatmap', async () => {
      const mockComplaints = [
        {
          latitude: 12.9716,
          longitude: 77.5946,
          category: 'pothole',
          priority: 'high'
        },
        {
          latitude: 12.9800,
          longitude: 77.6000,
          category: 'garbage',
          priority: 'medium'
        }
      ];

      db.query.mockResolvedValue({
        rows: mockComplaints
      });

      const response = await request(app)
        .get('/api/heatmap');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('latitude');
      expect(response.body[0]).toHaveProperty('longitude');
      expect(response.body[0]).toHaveProperty('category');
      expect(response.body[0]).toHaveProperty('priority');
    });
  });
});
