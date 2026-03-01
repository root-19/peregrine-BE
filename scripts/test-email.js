const { emailService } = require('../src/config/email');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testEmail() {
  console.log('📧 Testing email service...');
  
  try {
    console.log('🔧 Email Configuration:');
    console.log(`- EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`- EMAIL_PASS: ${process.env.EMAIL_PASS ? '***' : 'NOT SET'}`);
    console.log(`- EMAIL_FROM: ${process.env.EMAIL_FROM}`);
    
    await emailService.sendEmail({
      to: 'wasieacuna@gmail.com',
      subject: '🧪 Email Service Test - Peregrine Construction',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a5632; color: white; padding: 20px; text-align: center;">
            <h1>🏗️ Peregrine Construction</h1>
            <p>Email Service Test</p>
          </div>
          <div style="padding: 20px; background: #f0fdf4;">
            <h2>Hello!</h2>
            <p>This is a test email from the Peregrine Construction backend system.</p>
            <div style="background: white; padding: 15px; border-left: 4px solid #1a5632; margin: 20px 0;">
              <h3>📧 Email Service Test Results:</h3>
              <p><strong>Status:</strong> ✅ Working</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Service:</strong> Gmail SMTP</p>
            </div>
            <p>If you receive this email, the email service is working correctly!</p>
          </div>
          <div style="background: #1a5632; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>&copy; 2024 Peregrine Construction & Management L.L.C INC</p>
          </div>
        </div>
      `
    });
    
    console.log('✅ Email sent successfully!');
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Possible fixes:');
      console.log('1. Check Gmail credentials');
      console.log('2. Enable "Less secure app access" in Gmail');
      console.log('3. Use App Password instead of regular password');
    }
  }
}

testEmail();
