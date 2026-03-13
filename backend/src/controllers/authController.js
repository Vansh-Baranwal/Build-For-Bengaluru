const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const config = require('../config/env');
const logger = require('../config/logger');
const { ValidationError } = require('../middlewares/errorHandler');

/**
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    // Validate role
    const validRoles = ['citizen', 'news'];
    if (!validRoles.includes(role)) {
      throw new ValidationError('Registration is only available for Citizens and News officials.');
    }

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT user_id FROM public.users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new ValidationError('Email already registered');
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert user
    await db.query(
      `INSERT INTO public.users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4)`,
      [name, email, password_hash, role]
    );

    logger.info({ email, role }, 'User registered successfully');

    res.status(201).json({
      message: 'User registered successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Hardcoded Admin Login for Government Officials
    if (email === 'admin' && password === 'admin123') {
      logger.info('Hardcoded admin logged in');
      
      const adminToken = jwt.sign(
        {
          user_id: '00000000-0000-0000-0000-000000000000', // Virtual UUID for admin
          role: 'government',
          email: 'admin'
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      return res.status(200).json({
        token: adminToken,
        role: 'government',
        user: {
          user_id: '00000000-0000-0000-0000-000000000000',
          name: 'NammaFix Administrator',
          email: 'admin',
          role: 'government'
        }
      });
    }

    // Find user by email
    const result = await db.query(
      'SELECT user_id, name, email, password_hash, role FROM public.users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new ValidationError('Invalid email or password');
    }

    const user = result.rows[0];

    // Check if password_hash exists
    if (!user.password_hash) {
      throw new ValidationError('Account not set up for authentication');
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new ValidationError('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role,
        email: user.email
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logger.info({ user_id: user.user_id, role: user.role }, 'User logged in');

    res.status(200).json({
      token,
      role: user.role,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user profile
 * GET /api/auth/me
 */
async function getProfile(req, res, next) {
  try {
    const result = await db.query(
      'SELECT user_id, name, email, role, created_at FROM public.users WHERE user_id = $1',
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      throw new ValidationError('User not found');
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getProfile
};
