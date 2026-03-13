const db = require('../database/db');
const logger = require('../config/logger');
const { ValidationError } = require('../middlewares/errorHandler');

/**
 * Update user's last known location
 * PATCH /api/users/location
 */
async function updateLocation(req, res, next) {
  try {
    const { latitude, longitude } = req.body;
    const user_id = req.user.user_id;

    if (latitude === undefined || longitude === undefined) {
      throw new ValidationError('Latitude and longitude are required');
    }

    // Update user's last_location using PostGIS
    const result = await db.query(
      `UPDATE public.users 
       SET last_location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
       WHERE user_id = $3
       RETURNING user_id, ST_AsText(last_location) as location`,
      [longitude, latitude, user_id]
    );

    if (result.rows.length === 0) {
      throw new ValidationError('User not found');
    }

    logger.debug({ user_id, latitude, longitude }, 'User location updated');

    res.status(200).json({
      message: 'Location updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  updateLocation
};
