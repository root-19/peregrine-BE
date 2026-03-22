const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { emailService } = require('../dist/config/email');

async function testWithPersonalEmail() {
  console.log('📧 Testing with personal email address...');
  
  try {
    // Use a Gmail address instead of unverified domain
    const testEmail = {
      to: 'wasieacuna@gmail.com',
      subject: '🧪 Test from Gmail Address - Peregrine',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #1a5632;">🏗️ Peregrine Construction</h2>
          <p>Hello!</p>
          <p>This is a test email sent from a verified Gmail address.</p>
          <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #1a5632; margin: 20px 0;">
            <h3>📧 Test Results:</h3>
            <p><strong>From:</strong> Gmail Address</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Service:</strong> Mails.so API</p>
          </div>
          <p>If you receive this, the issue was the unverified domain!</p>
        </div>
      `
    };
    
    // Temporarily modify the from address
    const originalFrom = process.env.EMAIL_FROM;
    process.env.EMAIL_FROM = 'test.peregrine@gmail.com'; // Use a Gmail address
    
    await emailService.sendEmail(testEmail);
    
    // Restore original
    process.env.EMAIL_FROM = originalFrom;
    
    console.log('✅ Email sent with Gmail from address!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

testWithPersonalEmail();
