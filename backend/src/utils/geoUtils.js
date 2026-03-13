const db = require('../database/db');
const logger = require('../config/logger');

/**
 * Create a PostGIS POINT string from longitude and latitude
 * @param {number} longitude - Longitude coordinate (-180 to 180)
 * @param {number} latitude - Latitude coordinate (-90 to 90)
 * @returns {string} PostGIS POINT string in format "POINT(longitude latitude)"
 */
function createPoint(longitude, latitude) {
  return `POINT(${longitude} ${latitude})`;
}

/**
 * Find nearby complaints within a specified radius with matching category
 * Uses PostGIS ST_DWithin for efficient spatial queries
 * @param {number} longitude - Center point longitude
 * @param {number} latitude - Center point latitude
 * @param {number} radiusMeters - Search radius in meters
 * @param {string} category - Complaint category to match
 * @returns {Promise<Array>} Array of nearby complaints
 */
async function findNearbyComplaints(longitude, latitude, radiusMeters, category) {
  const query = `
    SELECT 
      complaint_id,
      category,
      cluster_id,
      ST_Distance(
        location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      ) as distance
    FROM complaints
    WHERE category = $3
      AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $4
      )
    ORDER BY distance
    LIMIT 10
  `;

  try {
    const result = await db.query(query, [longitude, latitude, category, radiusMeters]);
    return result.rows;
  } catch (error) {
    logger.error({ error, longitude, latitude, category }, 'Error finding nearby complaints');
    throw new Error('Failed to search for nearby complaints');
  }
}

/**
 * Assign a complaint to a cluster or create a new cluster
 * Logic:
 * - If a complaint exists within 100m with matching category, join that cluster
 * - Otherwise, create a new cluster
 * @param {string} complaintId - UUID of the complaint
 * @param {number} longitude - Complaint longitude
 * @param {number} latitude - Complaint latitude
 * @param {string} category - Complaint category
 * @returns {Promise<string>} cluster_id (existing or newly created)
 */
async function assignToCluster(complaintId, longitude, latitude, category) {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');

    // Check for nearby complaints with matching category within 100 meters
    const nearbyQuery = `
      SELECT cluster_id
      FROM complaints
      WHERE category = $1
        AND cluster_id IS NOT NULL
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
          100
        )
      LIMIT 1
    `;

    const nearbyResult = await client.query(nearbyQuery, [category, longitude, latitude]);

    let clusterId;

    if (nearbyResult.rows.length > 0) {
      // Join existing cluster
      clusterId = nearbyResult.rows[0].cluster_id;

      // Increment complaint count
      await client.query(
        'UPDATE clusters SET complaint_count = complaint_count + 1 WHERE cluster_id = $1',
        [clusterId]
      );

      logger.debug({ complaintId, clusterId }, 'Complaint joined existing cluster');
    } else {
      // Create new cluster
      const createClusterQuery = `
        INSERT INTO clusters (issue_type, location, complaint_count)
        VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, 1)
        RETURNING cluster_id
      `;

      const clusterResult = await client.query(createClusterQuery, [category, longitude, latitude]);
      clusterId = clusterResult.rows[0].cluster_id;

      logger.debug({ complaintId, clusterId }, 'Created new cluster for complaint');
    }

    // Update complaint with cluster_id
    await client.query(
      'UPDATE complaints SET cluster_id = $1 WHERE complaint_id = $2',
      [clusterId, complaintId]
    );

    await client.query('COMMIT');
    return clusterId;

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error, complaintId, category }, 'Error assigning complaint to cluster');
    throw new Error('Failed to assign complaint to cluster');
  } finally {
    client.release();
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * This is a backup utility for non-database distance calculations
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

module.exports = {
  createPoint,
  findNearbyComplaints,
  assignToCluster,
  calculateDistance
};
