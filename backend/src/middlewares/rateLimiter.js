const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for complaint submission endpoint
 * Limits: 5 requests per minute per IP address
 */
const complaintRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5, // Maximum 5 requests per window
  message: {
    error: 'Too many requests',
    details: 'Maximum 5 complaint submissions per minute. Please try again later.'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      details: 'Maximum 5 complaint submissions per minute. Please try again later.'
    });
  }
});

/**
 * General API rate limiter (optional, for other endpoints)
 * More lenient limits for read operations
 */
const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 100, // Maximum 100 requests per window
  message: {
    error: 'Too many requests',
    details: 'Rate limit exceeded. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  complaintRateLimiter,
  generalRateLimiter
};
