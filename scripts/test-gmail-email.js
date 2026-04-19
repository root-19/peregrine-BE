const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

class GmailEmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    try {
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      console.log('✅ Gmail email service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Gmail service:', error.message);
    }
  }

  async sendEmail(options) {
    if (!this.transporter) {
      throw new Error('Gmail service not initialized');
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const result = await this.transporter.sendMail(mailOptions);
    console.log(`✅ Gmail email sent to: ${options.to}`);
    return result;
  }
}

// Test Gmail service
async function testGmailEmail() {
  console.log('📧 Testing Gmail email service...');
  
  try {
    console.log('🔧 Gmail Configuration:');
    console.log(`- EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
    console.log(`- EMAIL_PASS: ${process.env.EMAIL_PASS ? '***' : 'NOT SET'}`);
    console.log(`- EMAIL_FROM: ${process.env.EMAIL_FROM || 'NOT SET'}`);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('❌ Gmail credentials not set');
      return;
    }

    const gmailService = new GmailEmailService();
    
    await gmailService.sendEmail({
      to: 'wasieacuna@gmail.com',
      subject: '🧪 Gmail Test - Peregrine Construction',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #1a5632;">🏗️ Peregrine Construction</h2>
          <p>Hello!</p>
          <p>This is a test email sent via Gmail service.</p>
          <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #1a5632; margin: 20px 0;">
            <h3>📧 Gmail Test Results:</h3>
            <p><strong>Status:</strong> ✅ Working</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Service:</strong> Gmail SMTP</p>
          </div>
          <p>If you receive this, Gmail service works!</p>
        </div>
      `
    });
    
    console.log('✅ Gmail email sent successfully!');
    
  } catch (error) {
    console.error('❌ Gmail test failed:', error);
    console.error('Error details:', error.message);
  }
}

testGmailEmail();
