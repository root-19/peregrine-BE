const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Test login endpoint to trigger email
async function testLoginEmail() {
  console.log('🔍 Testing login with email notification...');
  
  try {
    console.log('🔧 Email Configuration:');
    console.log(`- EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`- EMAIL_PASS: ${process.env.EMAIL_PASS ? '***' : 'NOT SET'}`);
    console.log(`- EMAIL_FROM: ${process.env.EMAIL_FROM}`);
    
    // Make a login request to trigger email
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'wasieacuna@gmail.com',
        role: 'COO'
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Login request successful!');
      console.log('📧 Check if email was sent to: wasieacuna@gmail.com');
      console.log('🔐 OTP (for testing):', result.data?.otp || 'Not included');
      console.log('👤 User:', result.data?.user?.name || 'Not found');
    } else {
      console.log('❌ Login failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Make sure the backend server is running:');
      console.log('npm run dev:tsx');
    }
  }
}

testLoginEmail();
