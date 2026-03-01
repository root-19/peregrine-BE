const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testMobileConnectivity() {
  console.log('🔍 Testing mobile app connectivity to backend...');
  
  try {
    console.log('📡 Testing API endpoints:');
    
    // Test health endpoint
    console.log('\n1. 🏥 Health Check:');
    const healthResponse = await fetch('http://192.168.1.18:3000/api/health');
    console.log(`   Status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   Response: ${healthData.status}`);
    }

    // Test login endpoint
    console.log('\n2. 🔐 Login Test:');
    const loginResponse = await fetch('http://192.168.1.18:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'wasieacuna@gmail.com',
        role: 'COO'
      })
    });
    
    console.log(`   Status: ${loginResponse.status}`);
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log(`   Success: ${loginData.success}`);
      console.log(`   User: ${loginData.data?.user?.name}`);
      console.log(`   OTP: ${loginData.data?.otp || 'Not included'}`);
    } else {
      const errorData = await loginResponse.json();
      console.log(`   Error: ${errorData.error}`);
    }

    // Test users endpoint
    console.log('\n3. 👥 Users Test:');
    const usersResponse = await fetch('http://192.168.1.18:3000/api/users');
    console.log(`   Status: ${usersResponse.status}`);
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log(`   Success: ${usersData.success}`);
      console.log(`   Users Count: ${usersData.data?.length || 0}`);
    } else {
      const errorData = await usersResponse.json();
      console.log(`   Error: ${errorData.error}`);
    }

    console.log('\n✅ Backend is accessible from this machine!');
    console.log('📱 If mobile app cannot connect, check:');
    console.log('   - Mobile app is using correct IP: http://192.168.1.18:3000/api');
    console.log('   - Mobile device is on same WiFi network');
    console.log('   - Firewall is not blocking port 3000');
    console.log('   - Backend server is binding to 0.0.0.0 (all interfaces)');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n🔧 Possible issues:');
    console.log('   - Backend server not running');
    console.log('   - Wrong IP address');
    console.log('   - Port 3000 blocked');
    console.log('   - Network connectivity issues');
  }
}

testMobileConnectivity();
