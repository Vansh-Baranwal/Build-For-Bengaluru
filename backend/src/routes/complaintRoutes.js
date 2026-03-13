const express = require('express');
const router = express.Router();

const complaintController = require('../controllers/complaintController');
const { 
  validateComplaintSubmission, 
  validateStatusUpdate, 
  validateComplaintId,
  handleValidationErrors 
} = require('../middlewares/validator');
const { complaintRateLimiter } = require('../middlewares/rateLimiter');

/**
 * POST /api/complaints
 * Create a new complaint
 * - Rate limited to 5 requests per minute per IP
 * - Validates description, latitude, longitude, and optional image_url
 */
router.post(
  '/complaints',
  complaintRateLimiter,
  validateComplaintSubmission,
  handleValidationErrors,
  complaintController.createComplaint
);

/**
 * GET /api/complaints/:id
 * Get complaint status by ID
 * - Validates complaint ID format
 */
router.get(
  '/complaints/:id',
  validateComplaintId,
  handleValidationErrors,
  complaintController.getComplaint
);

/**
 * PATCH /api/complaints/:id/status
 * Update complaint resolution status
 * - Validates complaint ID and status value
 */
router.patch(
  '/complaints/:id/status',
  validateStatusUpdate,
  handleValidationErrors,
  complaintController.updateComplaintStatus
);

/**
 * GET /api/trending
 * Get trending civic problems based on complaint clusters
 */
router.get('/trending', complaintController.getTrending);

/**
 * GET /api/heatmap
 * Get complaint locations for map visualization
 */
router.get('/heatmap', complaintController.getHeatmapData);

module.exports = router;
