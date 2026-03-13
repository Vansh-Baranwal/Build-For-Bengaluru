const request = require('supertest');
const app = require('../../../src/server');

// Mock the database
jest.mock('../../../src/database/db');
const db = require('../../../src/database/db');

describe('Health Check Endpoint', () => {
  test('GET /health should return status and database connection state', async () => {
    // Mock successful database connection
    db.checkConnection.mockResolvedValue({
      connected: true,
      timestamp: new Date(),
      postgis: true
    });

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('database', 'connected');
    expect(response.body).toHaveProperty('postgis');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('GET /health should return 503 when database is disconnected', async () => {
    // Mock failed database connection
    db.checkConnection.mockResolvedValue({
      connected: false,
      error: 'Connection refused'
    });

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('database', 'disconnected');
    expect(response.body).toHaveProperty('error');
  });

  test('GET /health should handle database check errors', async () => {
    // Mock database check throwing error
    db.checkConnection.mockRejectedValue(new Error('Database timeout'));

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('database', 'disconnected');
  });
});
