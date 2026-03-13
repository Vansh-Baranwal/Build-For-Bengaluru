const fc = require('fast-check');
const db = require('../../../src/database/db');

/**
 * Property-Based Tests for Database Spatial Functions
 * 
 * These tests verify universal properties of PostGIS spatial operations
 * using randomized inputs to catch edge cases.
 */

describe('Property Tests: Database Spatial Functions', () => {
  // Feature: nammafix-backend, Property 28: Distance Calculation Non-Negativity
  // **Validates: Requirements 14.2**
  test('ST_Distance should return non-negative values for any valid coordinate pairs', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two random valid coordinate pairs
        fc.float({ min: -90, max: 90, noNaN: true }),   // lat1
        fc.float({ min: -180, max: 180, noNaN: true }), // lon1
        fc.float({ min: -90, max: 90, noNaN: true }),   // lat2
        fc.float({ min: -180, max: 180, noNaN: true }), // lon2
        async (lat1, lon1, lat2, lon2) => {
          // Execute PostGIS ST_Distance query
          const query = `
            SELECT ST_Distance(
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
              ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
            ) as distance
          `;

          const result = await db.query(query, [lon1, lat1, lon2, lat2]);
          const distance = parseFloat(result.rows[0].distance);

          // Property: Distance must be non-negative
          expect(distance).toBeGreaterThanOrEqual(0);
          
          // Additional sanity check: Distance should be a finite number
          expect(Number.isFinite(distance)).toBe(true);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as per spec requirements
    );
  }, 30000); // Increase timeout for database operations

  // Additional property: Distance should be symmetric (d(A,B) = d(B,A))
  test('ST_Distance should be symmetric for any coordinate pairs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: -90, max: 90, noNaN: true }),   // lat1
        fc.float({ min: -180, max: 180, noNaN: true }), // lon1
        fc.float({ min: -90, max: 90, noNaN: true }),   // lat2
        fc.float({ min: -180, max: 180, noNaN: true }), // lon2
        async (lat1, lon1, lat2, lon2) => {
          const query = `
            SELECT ST_Distance(
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
              ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
            ) as distance
          `;

          // Calculate distance from point1 to point2
          const result1 = await db.query(query, [lon1, lat1, lon2, lat2]);
          const distance1 = parseFloat(result1.rows[0].distance);

          // Calculate distance from point2 to point1
          const result2 = await db.query(query, [lon2, lat2, lon1, lat1]);
          const distance2 = parseFloat(result2.rows[0].distance);

          // Property: Distance should be symmetric
          expect(distance1).toBeCloseTo(distance2, 5); // Allow small floating-point differences
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  // Property: Distance from a point to itself should be zero
  test('ST_Distance should return zero for identical coordinates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: -90, max: 90, noNaN: true }),   // lat
        fc.float({ min: -180, max: 180, noNaN: true }), // lon
        async (lat, lon) => {
          const query = `
            SELECT ST_Distance(
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            ) as distance
          `;

          const result = await db.query(query, [lon, lat]);
          const distance = parseFloat(result.rows[0].distance);

          // Property: Distance from point to itself should be zero
          expect(distance).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);
});
