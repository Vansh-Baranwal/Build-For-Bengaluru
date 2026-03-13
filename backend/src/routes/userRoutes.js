const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * PATCH /api/users/location
 * Update user's last known location
 */
router.patch('/location', authMiddleware, userController.updateLocation);

module.exports = router;
