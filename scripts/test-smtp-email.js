const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { emailService } = require('../dist/config/email');

async function testSMTPConfiguration() {
  console.log('📧 Testing SMTP Email Configuration...');
  
  try {
    console.log('🔧 SMTP Configuration:');
    console.log(`- MAIL_HOST: ${process.env.MAIL_HOST || 'smtp.gmail.com'}`);
    console.log(`- MAIL_PORT: ${process.env.MAIL_PORT || '587'}`);
    console.log(`- MAIL_USERNAME: ${process.env.MAIL_USERNAME || 'NOT SET'}`);
    console.log(`- MAIL_PASSWORD: ${process.env.MAIL_PASSWORD ? '***' : 'NOT SET'}`);
    console.log(`- EMAIL_FROM: ${process.env.EMAIL_FROM || 'NOT SET'}`);
    
    await emailService.sendEmail({
      to: 'wasieacuna@gmail.com',
      subject: '🧪 SMTP Test - Peregrine Construction',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #1a5632;">🏗️ Peregrine Construction</h2>
          <p>Hello!</p>
          <p>This is a test email sent via SMTP service.</p>
          <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #1a5632; margin: 20px 0;">
            <h3>📧 SMTP Test Results:</h3>
            <p><strong>Status:</strong> ✅ Working</p>
            <p><strong>Service:</strong> SMTP (Gmail)</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>If you receive this email, SMTP service is working perfectly!</p>
        </div>
      `
    });
    
    console.log('✅ SMTP test email sent successfully!');
    console.log('📬 Check your inbox for the test email.');
    
  } catch (error) {
    console.error('❌ SMTP test failed:', error);
    console.error('Error details:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('\n🔧 Possible fixes:');
      console.log('1. Check Gmail credentials (username/password)');
      console.log('2. Enable "Less secure app access" in Gmail');
      console.log('3. Use App Password instead of regular password');
      console.log('4. Check MAIL_USERNAME and MAIL_PASSWORD environment variables');
    }
  }
}

testSMTPConfiguration();
