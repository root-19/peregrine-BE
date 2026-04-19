require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function updateUserRole() {
  console.log(`\n🔥 Updating user role in Firebase Firestore for project: ${PROJECT_ID}\n`);
  
  const userEmail = 'wasiea1010@peregrine.com';
  
  try {
    // First, find the user by email
    const usersUrl = `${BASE}/users`;
    const response = await fetch(`${usersUrl}?where=${encodeURIComponent(JSON.stringify({
      fieldPath: 'email',
      op: 'EQUAL',
      value: { stringValue: userEmail }
    }))}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (!data.documents || data.documents.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const userDoc = data.documents[0];
    const userId = userDoc.name.split('/').pop();
    
    console.log(`📋 Found user: ${userId}`);
    console.log(`📧 Email: ${userDoc.fields.email?.stringValue}`);
    console.log(`👔 Current role: ${userDoc.fields.role?.stringValue}`);
    
    // Update the user role to MANAGER
    const updateUrl = `${BASE}/users/${userId}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          role: { stringValue: 'MANAGER' },
          updated_at: { timestampValue: new Date().toISOString() }
        }
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ User role updated successfully!');
      console.log(`👔 New role: MANAGER`);
      console.log('\n📋 Updated Login Credentials:');
      console.log(`Email: ${userEmail}`);
      console.log(`Password: password123`);
      console.log(`Role: MANAGER`);
      console.log(`Name: David Lee`);
    } else {
      console.log('❌ Failed to update user role');
      const error = await updateResponse.text();
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
  }
}

updateUserRole().catch(console.error);
