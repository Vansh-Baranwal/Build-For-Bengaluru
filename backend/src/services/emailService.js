const nodemailer = require('nodemailer');
const logger = require('../config/logger');

/**
 * Service to handle automated email notifications
 */
const emailService = {
  // Transporter configured with environment variables or temporary mock
  transporter: nodemailer.createTransport({
    // For demo/testing, using a mock transporter logic
    // In production, this would use Gmail, SendGrid, etc.
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    // Add timeouts to prevent hanging on Render
    connectionTimeout: 10000, 
    greetingTimeout: 5000,
    socketTimeout: 15000
  }),

  /**
   * Send an escalation alert to the higher authority
   * @param {Object} complaint - The overdue complaint details
   */
  async sendEscalationAlert(complaint) {
    const higherAuthorityEmail = 'vanshbaranwal21@gmail.com';
    
    const mailOptions = {
      from: '"NammaFix System" <noreply@nammafix.gov.in>',
      to: higherAuthorityEmail,
      subject: `🚨 CRITICAL: SLA Breach - Case #${complaint.complaint_id.slice(0, 8)}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #d32f2f;">Administrative Escalation Alert</h2>
          <p>This is an automated notification regarding a <strong>Service Level Agreement (SLA) breach</strong> in the NammaFix monitoring system.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Complaint ID</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${complaint.complaint_id}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Department</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${complaint.department_group}</td>
            </tr>
            <tr style="background: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Category</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${complaint.category}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Deadline Missed</td>
              <td style="padding: 10px; border: 1px solid #ddd; color: #d32f2f;">${new Date(complaint.deadline).toLocaleString()}</td>
            </tr>
            <tr style="background: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Description</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${complaint.description}</td>
            </tr>
          </table>

          <p>Please review the departmental performance for <strong>${complaint.department_group}</strong> and ensure immediate action is taken.</p>
          
          <div style="margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
            This is a system-generated message. Please do not reply directly to this email.
          </div>
        </div>
      `
    };

    try {
      logger.info({ 
        has_credentials: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
        smtp_user: process.env.SMTP_USER ? 'Present' : 'Missing'
      }, 'Preparing to send escalation email');

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const info = await this.transporter.sendMail(mailOptions);
        logger.info({ 
          to: higherAuthorityEmail, 
          complaint_id: complaint.complaint_id,
          messageId: info.messageId
        }, '📧 Escalation Email Sent Successfully');
      } else {
        logger.warn({ 
          to: higherAuthorityEmail, 
          complaint_id: complaint.complaint_id 
        }, '📧 SMTP credentials missing - Simulation Successful');
      }
      return true;
    } catch (error) {
      logger.error({ 
        error: error.message,
        code: error.code,
        command: error.command,
        complaint_id: complaint.complaint_id
      }, 'Failed to send escalation email');
      return false;
    }
  }
};

module.exports = emailService;
