require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function listUsers() {
  console.log(`\n🔥 Listing all users in Firebase Firestore for project: ${PROJECT_ID}\n`);
  
  try {
    const usersUrl = `${BASE}/users`;
    const response = await fetch(usersUrl, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (!data.documents || data.documents.length === 0) {
      console.log('❌ No users found');
      return;
    }
    
    console.log(`📋 Found ${data.documents.length} users:\n`);
    
    data.documents.forEach((doc, index) => {
      const fields = doc.fields;
      console.log(`${index + 1}. User ID: ${doc.name.split('/').pop()}`);
      console.log(`   Email: ${fields.email?.stringValue || 'N/A'}`);
      console.log(`   Name: ${fields.name?.stringValue || 'N/A'}`);
      console.log(`   Role: ${fields.role?.stringValue || 'N/A'}`);
      console.log(`   Position: ${fields.position?.stringValue || 'N/A'}`);
      console.log(`   Status: ${fields.status?.stringValue || 'N/A'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
}

listUsers().catch(console.error);
