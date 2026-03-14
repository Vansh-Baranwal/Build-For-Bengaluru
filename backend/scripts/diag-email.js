require('dotenv').config();
const nodemailer = require('nodemailer');
const { Client } = require('pg');

async function diagnostic() {
  console.log('--- NammaFix Email Diagnostic ---');
  
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  console.log(`SMTP User: ${user}`);
  console.log(`SMTP Pass: ${pass ? '********' : 'MISSING'}`);

  if (!user || !pass) {
    console.error('❌ SMTP credentials missing in .env');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });

  console.log('Testing SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP Connection verified successfully');
  } catch (error) {
    console.error('❌ SMTP Connection failed:', error.message);
  }

  console.log('\nTesting Email Sending...');
  const mailOptions = {
    from: `"NammaFix Diagnostic" <${user}>`,
    to: 'vanshbaranwal21@gmail.com',
    subject: 'Diagnostic Test',
    text: 'Test email from NammaFix diagnostic script.'
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
  }

  console.log('\nChecking Database for Escalation Status...');
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });
  
  try {
    await client.connect();
    const res = await client.query(`
      SELECT COUNT(*) as count 
      FROM complaints 
      WHERE deadline < NOW() AND is_escalated = FALSE AND status NOT IN ('resolved', 'closed')
    `);
    console.log(`Complaints awaiting escalation: ${res.rows[0].count}`);
    
    const lastEscalated = await client.query(`
      SELECT complaint_id, updated_at 
      FROM complaints 
      WHERE is_escalated = TRUE 
      ORDER BY updated_at DESC LIMIT 1
    `);
    if (lastEscalated.rows.length > 0) {
      console.log(`Last escalation occurred at: ${lastEscalated.rows[0].updated_at}`);
    } else {
      console.log('No complaints have been escalated yet.');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await client.end();
  }
}

diagnostic();
