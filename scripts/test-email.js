const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import the compiled email service from dist folder
const { emailService } = require('../dist/config/email');

async function testEmail() {
  console.log('📧 Testing email service...');
  
  try {
    console.log('🔧 Email Configuration:');
    console.log(`- MAILS_API_KEY: ${process.env.MAILS_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`- EMAIL_FROM: ${process.env.EMAIL_FROM || 'NOT SET'}`);
    
    await emailService.sendEmail({
      to: 'wasieacuna@gmail.com',
      subject: '🧪 Email Service Test - Peregrine Construction',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #1a5632;">🏗️ Peregrine Construction</h2>
          <p>Hello!</p>
          <p>This is a test email from the Peregrine Construction backend system.</p>
          <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #1a5632; margin: 20px 0;">
            <h3>📧 Email Service Test Results:</h3>
            <p><strong>Status:</strong> ✅ Working</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Service:</strong> Mails.so API</p>
          </div>
          <p>If you receive this email, the email service is working correctly!</p>
        </div>
      `
    });
    
    console.log('✅ Email sent successfully!');
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.error('Error details:', error.message);
    
    if (error.message.includes('MAILS_API_KEY')) {
      console.log('\n🔧 Possible fixes:');
      console.log('1. Set MAILS_API_KEY in environment variables');
      console.log('2. Set EMAIL_FROM in environment variables');
      console.log('3. Check deployment platform environment settings');
    }
  }
}

testEmail();
