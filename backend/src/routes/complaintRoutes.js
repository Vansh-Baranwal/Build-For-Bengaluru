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
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

const optionalAuthMiddleware = (req, res, next) => {
  // If no auth header exists, just continue anonymously
  if (!req.header('Authorization')) return next();
  // Otherwise try to verify it using the strict middleware
  return authMiddleware(req, res, (err) => {
    // If verification fails (e.g. invalid token), ignore and proceed anonymously
    if (err) return next();
    next();
  });
};

/**
 * POST /api/complaints
 * Create a new complaint
 * - Rate limited to 5 requests per minute per IP
 * - Validates description, latitude, longitude, and optional image_url
 * - Optional: Can be used by authenticated citizens or anonymously
 */
router.post(
  '/complaints',
  optionalAuthMiddleware,
  complaintRateLimiter,
  validateComplaintSubmission,
  handleValidationErrors,
  complaintController.createComplaint
);

/**
 * GET /api/complaints/me
 * Get all complaints submitted by the authenticated citizen
 */
router.get(
  '/complaints/me',
  authMiddleware,
  complaintController.getMyComplaints
);

/**
 * GET /api/complaints/:id
 * Get complaint status by ID
 * - Validates complaint ID format
 * - Public endpoint (no auth required)
 */
router.get(
  '/complaints/:id',
  validateComplaintId,
  handleValidationErrors,
  complaintController.getComplaint
);

/**
 * GET /api/complaints
 * Get all complaints (Government only)
 * - Requires authentication
 * - Requires government role
 */
router.get(
  '/complaints',
  authMiddleware,
  requireRole('government'),
  complaintController.getAllComplaints
);

/**
 * PATCH /api/complaints/:id/status
 * Update complaint resolution status (Government only)
 * - Requires authentication
 * - Requires government role
 * - Validates complaint ID and status value
 */
router.patch(
  '/complaints/:id/status',
  authMiddleware,
  requireRole('government'),
  validateStatusUpdate,
  handleValidationErrors,
  complaintController.updateComplaintStatus
);

/**
 * GET /api/trending
 * Get trending civic problems based on complaint clusters
 * - Public endpoint (accessible by all roles and anonymous users)
 */
router.get('/trending', complaintController.getTrending);

/**
 * GET /api/heatmap
 * Get complaint locations for map visualization
 * - Public endpoint (accessible by all roles and anonymous users)
 */
router.get('/heatmap', complaintController.getHeatmapData);

module.exports = router;
