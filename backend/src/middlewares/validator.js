const { body, param, validationResult } = require('express-validator');

/**
 * Validation rules for POST /api/complaints
 */
const validateComplaintSubmission = [
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('image_url')
    .optional()
];

/**
 * Validation rules for PATCH /api/complaints/:id/status
 */
const validateStatusUpdate = [
  param('id')
    .isUUID()
    .withMessage('Invalid complaint ID format'),
  
  body('status')
    .isIn(['pending', 'in_progress', 'resolved'])
    .withMessage('Status must be one of: pending, in_progress, resolved')
];

/**
 * Validation rules for GET /api/complaints/:id
 */
const validateComplaintId = [
  param('id')
    .isUUID()
    .withMessage('Invalid complaint ID format')
];

/**
 * Middleware to handle validation errors
 * Returns 400 Bad Request with detailed error messages
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    
    return res.status(400).json({
      error: 'Invalid input',
      details: firstError.msg,
      field: firstError.path
    });
  }
  
  next();
}

module.exports = {
  validateComplaintSubmission,
  validateStatusUpdate,
  validateComplaintId,
  handleValidationErrors
};
