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
  let { description, latitude, longitude } = req.body;
  let imageUrl = req.body.image_url || null;

  logger.debug({ 
    body: req.body, 
    files: req.files ? Object.keys(req.files) : 'none' 
  }, 'Processing createComplaint request');

  try {
    // Parse coordinates explicitly
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        details: 'Latitude and longitude must be valid numbers'
      });
    }

    // Step 0: Handle audio transcription if a file is provided
    if (req.files && req.files.audio) {
      logger.debug('Transcribing audio file');
      const audioFile = req.files.audio[0];
      const transcription = await aiService.transcribeAudio(audioFile.buffer, audioFile.originalname);
      logger.debug({ transcription }, 'Audio transcribed');
      
      // If no description, use transcription. If both, combine them.
      if (!description) {
        description = transcription;
      } else {
        description = `${description} (Voice description: ${transcription})`;
      }
    }

    // Validate that we have some kind of description now
    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        error: 'Invalid description',
        details: 'A description (text or voice) of at least 10 characters is required'
      });
    }

    // Step 1: Handle image upload if a file is provided
    if (req.files && req.files.image) {
      logger.debug('Uploading image file to storage');
      const imageFile = req.files.image[0];
      try {
        imageUrl = await storageService.uploadImage(imageFile);
      } catch (storageError) {
        logger.error({ 
          error: storageError.message,
          filename: imageFile.originalname 
        }, 'Image upload failed, proceeding without image');
        // We continue because we still want to save the complaint
      }
    }

    // Step 2: Analyze complaint using AI service (with optional image)
    logger.debug({ hasImage: !!imageUrl }, 'Analyzing complaint with AI service');
    
    let aiAnalysis;
    try {
      aiAnalysis = await aiService.analyzeComplaint(description, imageUrl);
    } catch (aiError) {
      logger.error({ 
        error: aiError.message, 
        description: description.substring(0, 50),
        hasImage: !!imageUrl
      }, 'AI Analysis failed, using fallbacks');
      
      // Fallback values so the complaint still gets saved
      aiAnalysis = {
        category: 'garbage',
        severity: 'medium',
        department_group: 'Cleaning Work',
        issue_type: 'Regular Problem'
      };
    }
    
    const { category, severity, department_group, issue_type } = aiAnalysis;

    // Step 3: Map severity to priority
    const priority = mapSeverityToPriority(severity);

    // Step 4: Insert complaint into database
    logger.debug({ category, priority, hasImage: !!imageUrl }, 'Inserting complaint into database');
    const insertQuery = `
      INSERT INTO complaints (
        user_id, description, category, priority, status, location, image_url, department_group, issue_type
      )
      VALUES (
        $1, $2, $3, $4, 'pending', 
        ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography,
        $7, $8, $9
      )
      RETURNING complaint_id, category, priority, status, created_at, department_group, issue_type
    `;

    // Extract user_id if the user is authenticated
    const user_id = req.user ? req.user.user_id : null;

    const result = await db.query(insertQuery, [
      user_id,
      description,
      category,
      priority,
      lng, // longitude
      lat, // latitude
      imageUrl,
      department_group,
      issue_type
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
      deadline: complaint.deadline,
      is_escalated: complaint.is_escalated,
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
    // 1. Get the user_id of the person who reported this issue
    const complaintInfo = await db.query(
      'SELECT user_id, status as old_status FROM complaints WHERE complaint_id = $1',
      [id]
    );

    if (complaintInfo.rows.length === 0) {
      return next(new NotFoundError(`Complaint with ID ${id} does not exist`));
    }

    const reporter_id = complaintInfo.rows[0].user_id;
    const oldStatus = complaintInfo.rows[0].old_status;

    // 2. Update complaint status
    const query = `
      UPDATE complaints
      SET status = $1,
          deadline = CASE WHEN $1 = 'in_progress' AND $3::timestamp IS NOT NULL THEN $3 ELSE deadline END,
          is_escalated = CASE WHEN $1 = 'resolved' THEN FALSE ELSE is_escalated END
      WHERE complaint_id = $2
      RETURNING 
        complaint_id,
        status,
        deadline,
        is_escalated,
        updated_at
    `;

    const result = await db.query(query, [status, id, req.body.deadline || null]);
    const updatedComplaint = result.rows[0];

    // 3. Handle Reputation Updates
    // Only update if status actually changed to a final state
    if (oldStatus !== status) {
      if (status === 'resolved') {
        await db.query(
          'UPDATE users SET reputation_score = reputation_score + 10 WHERE user_id = $1',
          [reporter_id]
        );
        logger.info({ user_id: reporter_id, points: 10 }, 'Awarded points for resolved complaint');
      } else if (status === 'rejected') {
        await db.query(
          'UPDATE users SET reputation_score = reputation_score - 20 WHERE user_id = $1',
          [reporter_id]
        );
        logger.info({ user_id: reporter_id, points: -20 }, 'Deducted points for false/rejected complaint');
      }
    }

    res.status(200).json({
      complaint_id: updatedComplaint.complaint_id,
      status: updatedComplaint.status,
      deadline: updatedComplaint.deadline,
      is_escalated: updatedComplaint.is_escalated,
      updated_at: updatedComplaint.updated_at
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
        c.complaint_id,
        c.description,
        c.category,
        c.priority,
        c.status,
        c.department_group,
        c.issue_type,
        c.image_url,
        c.deadline,
        c.is_escalated,
        ST_Y(c.location::geometry) as latitude,
        ST_X(c.location::geometry) as longitude,
        c.created_at,
        c.updated_at,
        u.reputation_score as reporter_reputation
      FROM complaints c
      JOIN users u ON c.user_id = u.user_id
      ORDER BY c.created_at DESC
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
        description,
        category,
        priority,
        status,
        department_group,
        issue_type,
        image_url,
        deadline,
        is_escalated,
        feedback_rating,
        feedback_comments,
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
    logger.debug('Fetching city news...');
    const news = await newsService.fetchCityNews();
    logger.debug({ count: news.length }, 'Fetched city news articles');
    res.status(200).json(news);
  } catch (error) {
    logger.error({ error }, 'Error retrieving city news');
    // We don't want to break the app if news fails, so return empty array
    res.status(200).json([]);
  }
}

/**
 * Get complaints near the user for community validation
 * GET /api/complaints/nearby
 */
async function getNearbyComplaints(req, res, next) {
  try {
    const user_id = req.user.user_id;

    // 1. Get user's last location
    const userResult = await db.query(
      'SELECT last_location FROM users WHERE user_id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].last_location) {
      return res.status(200).json([]); // No location, no nearby tasks
    }

    // 2. Find complaints within 5km that:
    // - Are pending
    // - Not created by user
    // - Not already verified by user
    const nearbyQuery = `
      SELECT 
        c.complaint_id, 
        c.description, 
        c.category, 
        c.priority, 
        c.image_url,
        ST_X(c.location::geometry) as longitude,
        ST_Y(c.location::geometry) as latitude,
        ST_Distance(c.location, $1) as distance_meters
      FROM complaints c
      LEFT JOIN complaint_verifications v ON c.complaint_id = v.complaint_id AND v.user_id = $2
      WHERE c.status = 'pending'
        AND c.user_id != $2
        AND v.id IS NULL
        AND ST_DWithin(c.location, $1, 5000)
      ORDER BY distance_meters ASC
      LIMIT 5
    `;

    const result = await db.query(nearbyQuery, [userResult.rows[0].last_location, user_id]);
    
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
}

/**
 * Submit community verification (Yes/No)
 * POST /api/complaints/:id/verify
 */
async function verifyComplaint(req, res, next) {
  const { id } = req.params;
  const { is_genuine } = req.body;
  const user_id = req.user.user_id;

  try {
    // 1. Record the verification
    await db.query(
      `INSERT INTO complaint_verifications (complaint_id, user_id, is_genuine)
       VALUES ($1, $2, $3)
       ON CONFLICT (complaint_id, user_id) DO UPDATE SET is_genuine = $3`,
      [id, user_id, is_genuine]
    );

    // 2. Check if it should be auto-closed
    // If it's a "false" report (is_genuine = false), count total false reports
    if (!is_genuine) {
      const voteResult = await db.query(
        'SELECT COUNT(*) as false_count FROM complaint_verifications WHERE complaint_id = $1 AND is_genuine = false',
        [id]
      );
      
      const falseCount = parseInt(voteResult.rows[0].false_count);
      
      if (falseCount >= 3) {
        // Find reporter
        const reporterResult = await db.query('SELECT user_id FROM complaints WHERE complaint_id = $1', [id]);
        
        if (reporterResult.rows.length > 0) {
          const reporter_id = reporterResult.rows[0].user_id;
          
          await db.query(
            "UPDATE complaints SET status = 'rejected' WHERE complaint_id = $1",
            [id]
          );

          await db.query(
            "UPDATE users SET reputation_score = reputation_score - 20 WHERE user_id = $1",
            [reporter_id]
          );

          logger.info({ complaint_id: id, reporter_id, falseCount }, 'Complaint automatically rejected by community and reputation deducted');
        }
      }
    }

    res.status(200).json({
      message: 'Verification submitted successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function submitFeedback(req, res, next) {
  const { id } = req.params;
  const { rating, comments } = req.body;
  const user_id = req.user.user_id;

  try {
    // 1. Verify that the complaint belongs to the user and is resolved
    const complaintResult = await db.query(
      'SELECT status, user_id FROM complaints WHERE complaint_id = $1',
      [id]
    );

    if (complaintResult.rows.length === 0) {
      return next(new NotFoundError(`Complaint with ID ${id} does not exist`));
    }

    const complaint = complaintResult.rows[0];

    if (complaint.user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized: You can only provide feedback for your own complaints' });
    }

    if (complaint.status !== 'resolved') {
      return res.status(400).json({ error: 'Feedback can only be provided for resolved complaints' });
    }

    // 2. Update the feedback
    const updateQuery = `
      UPDATE complaints
      SET feedback_rating = $1,
          feedback_comments = $2,
          updated_at = NOW()
      WHERE complaint_id = $3
      RETURNING complaint_id, feedback_rating, feedback_comments
    `;

    const result = await db.query(updateQuery, [rating, comments, id]);
    
    res.status(200).json({
      message: 'Feedback submitted successfully',
      feedback: result.rows[0]
    });

  } catch (error) {
    logger.error({ error, complaint_id: id }, 'Error submitting feedback');
    return next(new DatabaseError('Failed to submit feedback'));
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
  getCityNews,
  getNearbyComplaints,
  verifyComplaint,
  submitFeedback
};
