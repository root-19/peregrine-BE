const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import the compiled email service from dist folder
const { emailService } = require('../dist/config/email');

async function testLoginEmail() {
  console.log('🔍 Testing login email flow...');
  
  try {
    console.log('🔧 Email Configuration:');
    console.log(`- MAILS_API_KEY: ${process.env.MAILS_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`- EMAIL_FROM: ${process.env.EMAIL_FROM || 'NOT SET'}`);
    
    // Simulate the same email sending as in auth route
    const email = 'wasieacuna@gmail.com';
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const userName = 'Test User';
    
    console.log(`\n📧 Sending test email to: ${email}`);
    console.log(`🔑 OTP Code: ${otp}`);
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    
    // Validate email before sending
    const isValid = await emailService.validateEmail(email);
    console.log(`🔍 Email validation result: ${isValid}`);
    
    if (isValid) {
      await emailService.sendEmail({
        to: email,
        subject: `🔐 Login Verification - Peregrine Construction`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
            <h2 style="color: #1a5632;">🏗️ Peregrine Construction</h2>
            <p>Hello ${userName},</p>
            <p>A login attempt was made for your Peregrine Construction account.</p>
            <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #1a5632; margin: 20px 0;">
              <h3>🔐 Login Details:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Device:</strong> Mobile App</p>
              <p><strong>OTP Code:</strong> <span style="font-size: 24px; font-weight: bold; color: #1a5632;">${otp}</span></p>
            </div>
            <p>If this was you, please proceed with the login process.</p>
          </div>
        `
      });
      console.log('✅ Login email sent successfully!');
    } else {
      console.log('⚠️ Email validation failed - email not sent');
    }
    
  } catch (error) {
    console.error('❌ Login email test failed:', error);
    console.error('Error details:', error.message);
  }
}

testLoginEmail();
