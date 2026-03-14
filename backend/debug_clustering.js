const db = require('./src/database/db');
const geoUtils = require('./src/utils/geoUtils');

async function debugClustering() {
  try {
    const complaints = await db.query('SELECT complaint_id, ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude, category FROM complaints LIMIT 1');
    
    if (complaints.rows.length === 0) {
      console.log('No complaints found.');
      return;
    }

    const complaint = complaints.rows[0];
    console.log('Testing clustering for complaint:', complaint.complaint_id);

    const clusterId = await geoUtils.assignToCluster(
      complaint.complaint_id,
      complaint.longitude,
      complaint.latitude,
      complaint.category
    );

    console.log('Successfully assigned to cluster:', clusterId);

    const check = await db.query('SELECT * FROM clusters');
    console.log('Total clusters in DB:', check.rows.length);
    console.log('First cluster details:', JSON.stringify(check.rows[0], null, 2));

  } catch (error) {
    console.error('Clustering failed:', error);
  } finally {
    await db.closePool();
  }
}

debugClustering();
