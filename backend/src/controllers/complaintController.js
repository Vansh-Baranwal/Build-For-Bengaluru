const db = require('../database/db');
const aiService = require('../services/aiService');
const newsService = require('../services/newsService');
const storageService = require('../services/storageService');
const geoUtils = require('../utils/geoUtils');
const logger = require('../config/logger');
const { NotFoundError, AIServiceError, DatabaseError } = require('../middlewares/errorHandler');

/**
 * Map AI severity to priority
 * @param {string} severity - AI-determined severity (low, medium, high)
 * @returns {string} Priority level (low, medium, high)
 */
function mapSeverityToPriority(severity) {
  const mapping = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high'
  };
  return mapping[severity] || 'medium';
}

/**
 * Create a new complaint
 * POST /api/complaints
 */
async function createComplaint(req, res, next) {
  const { description, latitude, longitude } = req.body;
  let imageUrl = req.body.image_url || null;

  try {
    // Step 1: Handle image upload if a file is provided
    if (req.file) {
      logger.debug('Uploading file to storage');
      imageUrl = await storageService.uploadImage(req.file);
    }

    // Step 2: Analyze complaint using AI service (with optional image)
    logger.debug({ hasImage: !!imageUrl }, 'Analyzing complaint with AI service');
    const aiAnalysis = await aiService.analyzeComplaint(description, imageUrl);
    const { category, severity, department } = aiAnalysis;

    // Step 3: Map severity to priority
    const priority = mapSeverityToPriority(severity);

    // Step 4: Insert complaint into database
    logger.debug({ category, priority, hasImage: !!imageUrl }, 'Inserting complaint into database');
    const insertQuery = `
      INSERT INTO complaints (
        user_id, description, category, priority, status, location, image_url
      )
      VALUES (
        $1, $2, $3, $4, 'pending', 
        ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography,
        $7
      )
      RETURNING complaint_id, category, priority, status, created_at
    `;

    // Extract user_id if the user is authenticated
    const user_id = req.user ? req.user.user_id : null;

    const result = await db.query(insertQuery, [
      user_id,
      description,
      category,
      priority,
      longitude,
      latitude,
      imageUrl
    ]);

    const complaint = result.rows[0];

    // Step 4: Assign to cluster (asynchronously, don't block response)
    // This runs in the background
    geoUtils.assignToCluster(complaint.complaint_id, longitude, latitude, category)
      .then(() => {
        logger.debug({ complaint_id: complaint.complaint_id }, 'Complaint assigned to cluster');
      })
      .catch(error => {
        logger.error({ error, complaint_id: complaint.complaint_id }, 'Failed to assign complaint to cluster');
        // Don't fail the request if clustering fails
      });

    // Step 5: Return response
    res.status(201).json({
      complaint_id: complaint.complaint_id,
      category: complaint.category,
      priority: complaint.priority,
      status: complaint.status
    });

  } catch (error) {
    logger.error({ error, description: description.substring(0, 50) }, 'Error creating complaint');
    
    if (error.message.includes('AI processing')) {
      return next(new AIServiceError(error.message));
    }
    
    return next(new DatabaseError('Failed to create complaint'));
  }
}

module.exports = {
  createComplaint
};

/**
 * Get complaint by ID
 * GET /api/complaints/:id
 */
async function getComplaint(req, res, next) {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        complaint_id,
        category,
        priority,
        status,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude,
        created_at
      FROM complaints
      WHERE complaint_id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return next(new NotFoundError(`Complaint with ID ${id} does not exist`));
    }

    const complaint = result.rows[0];

    // Return complaint data (excluding user personal information)
    res.status(200).json({
      complaint_id: complaint.complaint_id,
      category: complaint.category,
      priority: complaint.priority,
      status: complaint.status,
      latitude: complaint.latitude,
      longitude: complaint.longitude,
      created_at: complaint.created_at
    });

  } catch (error) {
    logger.error({ error, complaint_id: id }, 'Error retrieving complaint');
    return next(new DatabaseError('Failed to retrieve complaint'));
  }
}

/**
 * Update complaint status
 * PATCH /api/complaints/:id/status
 */
async function updateComplaintStatus(req, res, next) {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Update complaint status (updated_at will be automatically updated by trigger)
    const query = `
      UPDATE complaints
      SET status = $1
      WHERE complaint_id = $2
      RETURNING 
        complaint_id,
        status,
        updated_at
    `;

    const result = await db.query(query, [status, id]);

    if (result.rows.length === 0) {
      return next(new NotFoundError(`Complaint with ID ${id} does not exist`));
    }

    const complaint = result.rows[0];

    res.status(200).json({
      complaint_id: complaint.complaint_id,
      status: complaint.status,
      updated_at: complaint.updated_at
    });

  } catch (error) {
    logger.error({ error, complaint_id: id, status }, 'Error updating complaint status');
    return next(new DatabaseError('Failed to update complaint status'));
  }
}

/**
 * Get trending issues based on complaint clusters
 * GET /api/trending
 */
async function getTrending(req, res, next) {
  try {
    const query = `
      SELECT 
        cluster_id,
        issue_type,
        latitude,
        longitude,
        complaint_count
      FROM clusters
      ORDER BY complaint_count DESC
      LIMIT 20
    `;

    const result = await db.query(query);

    // Return trending clusters (no citizen personal data)
    res.status(200).json(result.rows);

  } catch (error) {
    logger.error({ error }, 'Error retrieving trending issues');
    return next(new DatabaseError('Failed to retrieve trending issues'));
  }
}

/**
 * Get heatmap data for visualization
 * GET /api/heatmap
 */
async function getHeatmapData(req, res, next) {
  try {
    const query = `
      SELECT 
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude,
        category,
        priority
      FROM complaints
      ORDER BY created_at DESC
    `;

    const result = await db.query(query);

    // Return complaint locations (no citizen personal data)
    res.status(200).json(result.rows);

  } catch (error) {
    logger.error({ error }, 'Error retrieving heatmap data');
    return next(new DatabaseError('Failed to retrieve heatmap data'));
  }
}

/**
 * Get all complaints (Government only)
 * GET /api/complaints
 */
async function getAllComplaints(req, res, next) {
  try {
    const query = `
      SELECT 
        complaint_id,
        category,
        priority,
        status,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude,
        created_at,
        updated_at
      FROM complaints
      ORDER BY created_at DESC
    `;

    const result = await db.query(query);

    res.status(200).json(result.rows);

  } catch (error) {
    logger.error({ error }, 'Error retrieving all complaints');
    return next(new DatabaseError('Failed to retrieve complaints'));
  }
}

/**
 * Get all complaints for the currently authenticated user
 * GET /api/complaints/me
 */
async function getMyComplaints(req, res, next) {
  try {
    const user_id = req.user.user_id;
    
    const query = `
      SELECT 
        complaint_id,
        category,
        priority,
        status,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude,
        created_at,
        updated_at
      FROM complaints
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [user_id]);

    res.status(200).json(result.rows);

  } catch (error) {
    logger.error({ error, user_id: req.user.user_id }, 'Error retrieving user complaints');
    return next(new DatabaseError('Failed to retrieve your complaints'));
  }
}

/**
 * Get city news related to civic issues
 * GET /api/news
 */
async function getCityNews(req, res, next) {
  try {
    const news = await newsService.fetchCityNews();
    res.status(200).json(news);
  } catch (error) {
    logger.error({ error }, 'Error retrieving city news');
    // We don't want to break the app if news fails, so return empty array
    res.status(200).json([]);
  }
}

module.exports = {
  createComplaint,
  getComplaint,
  getAllComplaints,
  getMyComplaints,
  updateComplaintStatus,
  getTrending,
  getHeatmapData,
  getCityNews
};
