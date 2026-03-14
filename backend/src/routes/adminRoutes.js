const express = require('express');
const emailService = require('../services/emailService');
const escalationService = require('../services/escalationService');
const db = require('../database/db');
const logger = require('../config/logger');

const router = express.Router();

/**
 * GET /api/admin/test-email
 * Manually trigger a test email
 */
router.get('/test-email', async (req, res) => {
  try {
    const testComplaint = {
      complaint_id: 'DIAG-TEST-' + Date.now(),
      category: 'Diagnostic',
      department_group: 'System Admin',
      description: 'Manual diagnostic email trigger',
      deadline: new Date()
    };
    
    const success = await emailService.sendEscalationAlert(testComplaint);
    
    if (success) {
      res.json({ message: 'Test email triggered successfully. Check logs for details.' });
    } else {
      res.status(500).json({ message: 'Failed to send test email. Check logs for errors.' });
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Admin test-email error');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/trigger-escalation
 * Manually trigger escalation scan
 */
router.get('/trigger-escalation', async (req, res) => {
  try {
    logger.info('Manual escalation trigger initiated');
    await escalationService.checkEscalations();
    res.json({ message: 'Escalation scan completed. Check logs for results.' });
  } catch (error) {
    logger.error({ error: error.message }, 'Admin trigger-escalation error');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/db-check
 * Verify database connectivity and overdue count
 */
router.get('/db-check', async (req, res) => {
  try {
    const overdueRes = await db.query(`
      SELECT COUNT(*) as count 
      FROM complaints 
      WHERE deadline < NOW() AND is_escalated = FALSE AND status NOT IN ('resolved', 'closed')
    `);
    
    res.json({ 
      overdue_count: overdueRes.rows[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
