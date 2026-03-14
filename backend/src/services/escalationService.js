const cron = require('node-cron');
const db = require('../database/db');
const logger = require('../config/logger');
const emailService = require('./emailService');

/**
 * Service to handle automatic escalation of complaints that exceed their deadline
 */
const escalationService = {
  /**
   * Initialize the escalation cron job
   * Runs every hour (0 * * * *)
   */
  init() {
    logger.info('Initializing Escalation Service...');
    
    // Check every minute for Hackathon Mode
    cron.schedule('* * * * *', async () => {
      const now = new Date().toISOString();
      logger.info({ timestamp: now }, '⏰ Cron Heartbeat: Checking for escalations');
      try {
        await this.checkEscalations();
      } catch (error) {
        logger.error({ error: error.message }, '❌ Cron Escalation execution failed');
      }
    });
    
    // Run once on startup to catch up
    this.checkEscalations().catch(err => logger.error({ err }, 'Initial escalation check failed'));
    
    logger.info('Escalation Service initialized (Heartbeat active)');
  },

  /**
   * Main logic to find overdue complaints and escalate them
   */
  async checkEscalations() {
    try {
      logger.info('Running Escalation Scan...');
      
      // 1. Fetch complaints that need escalation
      const selectQuery = `
        SELECT complaint_id, category, department_group, description, deadline
        FROM public.complaints
        WHERE 
          status != 'resolved' AND 
          status != 'closed' AND
          deadline < NOW() AND
          is_escalated = FALSE
      `;
      
      const toEscalate = await db.query(selectQuery);
      
      if (toEscalate.rows.length > 0) {
        logger.info({ 
          count: toEscalate.rows.length,
          sample_id: toEscalate.rows[0].complaint_id 
        }, 'Found complaints for escalation - Processing loop');

        for (const complaint of toEscalate.rows) {
          try {
            // 2. Perform the database update
            await db.query(`
              UPDATE public.complaints 
              SET is_escalated = TRUE 
              WHERE complaint_id = $1
            `, [complaint.complaint_id]);

            // 3. Trigger the email alert
            await emailService.sendEscalationAlert(complaint);
            
            logger.info({ id: complaint.complaint_id }, 'Escalation complete for complaint');
          } catch (itemError) {
            logger.error({ 
              id: complaint.complaint_id, 
              error: itemError.message 
            }, 'Failed to process individual escalation');
          }
        }
      } else {
        logger.info('No new escalations found.');
      }
    } catch (error) {
      logger.error({ error: error.message }, 'Escalation service check failed');
    }
  }
};

module.exports = escalationService;
