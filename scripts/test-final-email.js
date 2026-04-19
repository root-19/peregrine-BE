const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { emailService } = require('../dist/config/email');

async function testCompleteLoginFlow() {
  console.log('🔐 Testing complete login flow with correct email...');
  
  try {
    console.log('🔧 Final Email Configuration:');
    console.log(`- MAILS_API_KEY: ${process.env.MAILS_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`- EMAIL_FROM: ${process.env.EMAIL_FROM || 'wasieacuna@gmail.com'}`);
    
    // Simulate exact login email
    const email = 'wasieacuna@gmail.com';
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const userName = 'Admin User';
    const role = 'COO';
    
    console.log(`\n📧 Sending login OTP to: ${email}`);
    console.log(`🔑 OTP Code: ${otp}`);
    console.log(`👤 Role: ${role}`);
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    
    // Validate email
    const isValid = await emailService.validateEmail(email);
    console.log(`🔍 Email validation: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
    
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
              <p><strong>Role:</strong> ${role}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Device:</strong> Mobile App</p>
              <p><strong>OTP Code:</strong> <span style="font-size: 24px; font-weight: bold; color: #1a5632;">${otp}</span></p>
            </div>
            <p><strong>This email should now arrive in your inbox!</strong></p>
            <p>If this was you, please proceed with the login process.</p>
            <p>If you did not attempt this login, please secure your account immediately.</p>
          </div>
        `
      });
      
      console.log('✅ Login email sent successfully!');
      console.log('📬 Check your inbox (including spam folder) for the OTP email.');
      console.log(`🔑 Use OTP code: ${otp}`);
      
    } else {
      console.log('❌ Email validation failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

testCompleteLoginFlow();
