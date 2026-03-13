const geoUtils = require('../../../src/utils/geoUtils');

describe('Geographic Utility Functions', () => {
  describe('createPoint', () => {
    test('should create PostGIS POINT string with correct format', () => {
      const point = geoUtils.createPoint(77.5946, 12.9716);
      expect(point).toBe('POINT(77.5946 12.9716)');
    });

    test('should handle negative coordinates', () => {
      const point = geoUtils.createPoint(-122.4194, 37.7749);
      expect(point).toBe('POINT(-122.4194 37.7749)');
    });

    test('should handle zero coordinates', () => {
      const point = geoUtils.createPoint(0, 0);
      expect(point).toBe('POINT(0 0)');
    });
  });

  describe('calculateDistance', () => {
    test('should return zero distance for same location', () => {
      const distance = geoUtils.calculateDistance(
        12.9716, 77.5946,
        12.9716, 77.5946
      );
      expect(distance).toBe(0);
    });

    test('should calculate distance between two coordinates', () => {
      // Bangalore to nearby location (~1km)
      const distance = geoUtils.calculateDistance(
        12.9716, 77.5946,
        12.9800, 77.6000
      );
      
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(2000); // Less than 2km
    });

    test('should return non-negative distance', () => {
      const distance = geoUtils.calculateDistance(
        12.9716, 77.5946,
        13.0827, 80.2707 // Chennai
      );
      
      expect(distance).toBeGreaterThanOrEqual(0);
    });

    test('should handle coordinates at opposite ends', () => {
      const distance = geoUtils.calculateDistance(
        0, 0,
        0, 180
      );
      
      expect(distance).toBeGreaterThan(0);
    });
  });
});
