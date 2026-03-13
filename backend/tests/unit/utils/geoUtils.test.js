// Mock the env module before any imports
jest.mock('../../../src/config/env', () => ({
  database: {
    url: 'postgresql://test:test@localhost:5432/test',
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-key'
  },
  groq: {
    apiKey: 'test-groq-key'
  },
  server: {
    port: 3000,
    nodeEnv: 'test'
  }
}));

// Mock the database module
jest.mock('../../../src/database/db');

// Mock the logger
jest.mock('../../../src/config/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}));

const geoUtils = require('../../../src/utils/geoUtils');
const db = require('../../../src/database/db');

describe('Geographic Utility Functions', () => {
  
  describe('createPoint', () => {
    it('should create a valid PostGIS POINT string with positive coordinates', () => {
      const result = geoUtils.createPoint(77.5946, 12.9716);
      expect(result).toBe('POINT(77.5946 12.9716)');
    });

    it('should create a valid PostGIS POINT string with negative coordinates', () => {
      const result = geoUtils.createPoint(-122.4194, 37.7749);
      expect(result).toBe('POINT(-122.4194 37.7749)');
    });

    it('should create a valid PostGIS POINT string with zero coordinates', () => {
      const result = geoUtils.createPoint(0, 0);
      expect(result).toBe('POINT(0 0)');
    });

    it('should create a valid PostGIS POINT string with boundary coordinates', () => {
      const result = geoUtils.createPoint(180, 90);
      expect(result).toBe('POINT(180 90)');
    });

    it('should format coordinates with decimal precision', () => {
      const result = geoUtils.createPoint(77.123456789, 12.987654321);
      expect(result).toBe('POINT(77.123456789 12.987654321)');
    });

    it('should maintain longitude-latitude order (not lat-long)', () => {
      const longitude = 77.5946;
      const latitude = 12.9716;
      const result = geoUtils.createPoint(longitude, latitude);
      expect(result).toContain(`${longitude} ${latitude}`);
      expect(result).not.toContain(`${latitude} ${longitude}`);
    });
  });

  describe('findNearbyComplaints', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should find complaints within specified radius with matching category', async () => {
      const mockComplaints = [
        {
          complaint_id: 'uuid-1',
          category: 'pothole',
          cluster_id: 'cluster-1',
          distance: 50
        },
        {
          complaint_id: 'uuid-2',
          category: 'pothole',
          cluster_id: 'cluster-1',
          distance: 75
        }
      ];

      db.query.mockResolvedValue({ rows: mockComplaints });

      const result = await geoUtils.findNearbyComplaints(77.5946, 12.9716, 100, 'pothole');

      expect(result).toEqual(mockComplaints);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ST_DWithin'),
        [77.5946, 12.9716, 'pothole', 100]
      );
    });

    it('should return empty array when no complaints found within radius', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await geoUtils.findNearbyComplaints(77.5946, 12.9716, 100, 'pothole');

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should only return complaints with matching category', async () => {
      const mockComplaints = [
        {
          complaint_id: 'uuid-1',
          category: 'garbage',
          cluster_id: 'cluster-2',
          distance: 30
        }
      ];

      db.query.mockResolvedValue({ rows: mockComplaints });

      const result = await geoUtils.findNearbyComplaints(77.5946, 12.9716, 100, 'garbage');

      expect(result).toEqual(mockComplaints);
      expect(result.every(c => c.category === 'garbage')).toBe(true);
    });

    it('should return complaints ordered by distance', async () => {
      const mockComplaints = [
        { complaint_id: 'uuid-1', category: 'pothole', distance: 25 },
        { complaint_id: 'uuid-2', category: 'pothole', distance: 50 },
        { complaint_id: 'uuid-3', category: 'pothole', distance: 90 }
      ];

      db.query.mockResolvedValue({ rows: mockComplaints });

      const result = await geoUtils.findNearbyComplaints(77.5946, 12.9716, 100, 'pothole');

      // Verify results are ordered by distance (ascending)
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].distance).toBeLessThanOrEqual(result[i + 1].distance);
      }
    });

    it('should handle different radius values correctly', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await geoUtils.findNearbyComplaints(77.5946, 12.9716, 500, 'pothole');

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        [77.5946, 12.9716, 'pothole', 500]
      );
    });

    it('should throw error when database query fails', async () => {
      db.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        geoUtils.findNearbyComplaints(77.5946, 12.9716, 100, 'pothole')
      ).rejects.toThrow('Failed to search for nearby complaints');
    });

    it('should use PostGIS ST_DWithin for spatial queries', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await geoUtils.findNearbyComplaints(77.5946, 12.9716, 100, 'pothole');

      const queryCall = db.query.mock.calls[0][0];
      expect(queryCall).toContain('ST_DWithin');
      expect(queryCall).toContain('ST_SetSRID');
      expect(queryCall).toContain('ST_MakePoint');
    });
  });

  describe('assignToCluster', () => {
    let mockClient;

    beforeEach(() => {
      jest.clearAllMocks();
      
      mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      db.getClient.mockResolvedValue(mockClient);
    });

    it('should create a new cluster when no nearby complaints exist', async () => {
      // Mock: No nearby complaints found
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT nearby complaints
        .mockResolvedValueOnce({ rows: [{ cluster_id: 'new-cluster-id' }] }) // INSERT cluster
        .mockResolvedValueOnce({ rows: [] }) // UPDATE complaint
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const clusterId = await geoUtils.assignToCluster(
        'complaint-1',
        77.5946,
        12.9716,
        'pothole'
      );

      expect(clusterId).toBe('new-cluster-id');
      
      // Verify new cluster was created
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO clusters'),
        ['pothole', 77.5946, 12.9716]
      );

      // Verify complaint was updated with cluster_id
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE complaints SET cluster_id'),
        ['new-cluster-id', 'complaint-1']
      );

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should join existing cluster when complaint exists within 100m radius', async () => {
      // Mock: Nearby complaint with cluster found
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ cluster_id: 'existing-cluster-id' }] }) // SELECT nearby
        .mockResolvedValueOnce({ rows: [] }) // UPDATE cluster count
        .mockResolvedValueOnce({ rows: [] }) // UPDATE complaint
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const clusterId = await geoUtils.assignToCluster(
        'complaint-2',
        77.5946,
        12.9716,
        'pothole'
      );

      expect(clusterId).toBe('existing-cluster-id');

      // Verify cluster count was incremented
      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE clusters SET complaint_count = complaint_count + 1 WHERE cluster_id = $1',
        ['existing-cluster-id']
      );

      // Verify complaint was updated with existing cluster_id
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE complaints SET cluster_id'),
        ['existing-cluster-id', 'complaint-2']
      );

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should create new cluster when nearby complaints have different category', async () => {
      // Mock: No nearby complaints with matching category
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT nearby (no match)
        .mockResolvedValueOnce({ rows: [{ cluster_id: 'new-cluster-id-2' }] }) // INSERT cluster
        .mockResolvedValueOnce({ rows: [] }) // UPDATE complaint
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const clusterId = await geoUtils.assignToCluster(
        'complaint-3',
        77.5946,
        12.9716,
        'garbage'
      );

      expect(clusterId).toBe('new-cluster-id-2');

      // Verify new cluster was created with correct category
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO clusters'),
        ['garbage', 77.5946, 12.9716]
      );
    });

    it('should use 100 meter radius for duplicate detection', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT nearby
        .mockResolvedValueOnce({ rows: [{ cluster_id: 'new-cluster' }] }) // INSERT
        .mockResolvedValueOnce({ rows: [] }) // UPDATE complaint
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      await geoUtils.assignToCluster('complaint-4', 77.5946, 12.9716, 'pothole');

      // Check that the nearby query uses 100 meter radius
      const nearbyQueryCall = mockClient.query.mock.calls.find(call => 
        call[0].includes('ST_DWithin') && call[0].includes('SELECT cluster_id')
      );

      expect(nearbyQueryCall).toBeDefined();
      expect(nearbyQueryCall[0]).toContain('100');
    });

    it('should rollback transaction on error', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Database error')); // SELECT fails

      await expect(
        geoUtils.assignToCluster('complaint-5', 77.5946, 12.9716, 'pothole')
      ).rejects.toThrow('Failed to assign complaint to cluster');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should commit transaction on success', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT
        .mockResolvedValueOnce({ rows: [{ cluster_id: 'cluster-id' }] }) // INSERT
        .mockResolvedValueOnce({ rows: [] }) // UPDATE complaint
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      await geoUtils.assignToCluster('complaint-6', 77.5946, 12.9716, 'pothole');

      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release client even when error occurs', async () => {
      mockClient.query.mockRejectedValue(new Error('Database error'));

      await expect(
        geoUtils.assignToCluster('complaint-7', 77.5946, 12.9716, 'pothole')
      ).rejects.toThrow();

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle multiple complaints joining same cluster', async () => {
      // First complaint creates cluster
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT (no nearby)
        .mockResolvedValueOnce({ rows: [{ cluster_id: 'shared-cluster' }] }) // INSERT
        .mockResolvedValueOnce({ rows: [] }) // UPDATE complaint
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const clusterId1 = await geoUtils.assignToCluster(
        'complaint-8',
        77.5946,
        12.9716,
        'pothole'
      );

      expect(clusterId1).toBe('shared-cluster');

      // Reset mocks for second complaint
      jest.clearAllMocks();
      db.getClient.mockResolvedValue(mockClient);

      // Second complaint joins existing cluster
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ cluster_id: 'shared-cluster' }] }) // SELECT (found)
        .mockResolvedValueOnce({ rows: [] }) // UPDATE cluster count
        .mockResolvedValueOnce({ rows: [] }) // UPDATE complaint
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const clusterId2 = await geoUtils.assignToCluster(
        'complaint-9',
        77.5947,
        12.9717,
        'pothole'
      );

      expect(clusterId2).toBe('shared-cluster');
      expect(clusterId1).toBe(clusterId2);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Bangalore to Mumbai (approximate distance ~850km)
      const distance = geoUtils.calculateDistance(12.9716, 77.5946, 19.0760, 72.8777);
      
      // Distance should be approximately 850,000 meters (850 km)
      expect(distance).toBeGreaterThan(800000);
      expect(distance).toBeLessThan(900000);
    });

    it('should return zero distance for same coordinates', () => {
      const distance = geoUtils.calculateDistance(12.9716, 77.5946, 12.9716, 77.5946);
      expect(distance).toBe(0);
    });

    it('should return non-negative distance', () => {
      const distance = geoUtils.calculateDistance(12.9716, 77.5946, 13.0000, 77.6000);
      expect(distance).toBeGreaterThanOrEqual(0);
    });

    it('should calculate short distances accurately', () => {
      // Two points approximately 100 meters apart
      const lat1 = 12.9716;
      const lon1 = 77.5946;
      const lat2 = 12.9725; // ~100m north
      const lon2 = 77.5946;

      const distance = geoUtils.calculateDistance(lat1, lon1, lat2, lon2);
      
      // Should be approximately 100 meters
      expect(distance).toBeGreaterThan(90);
      expect(distance).toBeLessThan(110);
    });

    it('should handle negative coordinates', () => {
      // San Francisco to Los Angeles
      const distance = geoUtils.calculateDistance(37.7749, -122.4194, 34.0522, -118.2437);
      
      // Distance should be approximately 560 km
      expect(distance).toBeGreaterThan(500000);
      expect(distance).toBeLessThan(600000);
    });

    it('should be symmetric (distance A to B equals B to A)', () => {
      const lat1 = 12.9716;
      const lon1 = 77.5946;
      const lat2 = 13.0000;
      const lon2 = 77.6000;

      const distanceAB = geoUtils.calculateDistance(lat1, lon1, lat2, lon2);
      const distanceBA = geoUtils.calculateDistance(lat2, lon2, lat1, lon1);

      expect(distanceAB).toBeCloseTo(distanceBA, 2);
    });

    it('should handle equator crossing', () => {
      const distance = geoUtils.calculateDistance(-1, 0, 1, 0);
      
      // 2 degrees of latitude is approximately 222 km
      expect(distance).toBeGreaterThan(200000);
      expect(distance).toBeLessThan(250000);
    });

    it('should handle prime meridian crossing', () => {
      const distance = geoUtils.calculateDistance(0, -1, 0, 1);
      
      // 2 degrees of longitude at equator is approximately 222 km
      expect(distance).toBeGreaterThan(200000);
      expect(distance).toBeLessThan(250000);
    });
  });
});
