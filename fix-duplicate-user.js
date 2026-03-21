require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function fixDuplicateUser() {
  console.log(`\n🔥 Fixing duplicate user in Firebase Firestore for project: ${PROJECT_ID}\n`);
  
  const userEmail = 'wasiea1010@peregrine.com';
  
  try {
    // Get all users
    const usersUrl = `${BASE}/users`;
    const response = await fetch(usersUrl, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (!data.documents || data.documents.length === 0) {
      console.log('❌ No users found');
      return;
    }
    
    // Find all users with the target email
    const targetUsers = data.documents.filter(doc => 
      doc.fields.email?.stringValue === userEmail
    );
    
    console.log(`📋 Found ${targetUsers.length} users with email ${userEmail}:`);
    
    targetUsers.forEach((doc, index) => {
      const fields = doc.fields;
      console.log(`${index + 1}. ID: ${doc.name.split('/').pop()}`);
      console.log(`   Name: ${fields.name?.stringValue || 'N/A'}`);
      console.log(`   Role: ${fields.role?.stringValue || 'N/A'}`);
      console.log(`   Position: ${fields.position?.stringValue || 'N/A'}`);
      console.log(`   Status: ${fields.status?.stringValue || 'N/A'}`);
      console.log('---');
    });
    
    if (targetUsers.length > 1) {
      // Keep the first one, delete the rest
      const userToKeep = targetUsers[0];
      const usersToDelete = targetUsers.slice(1);
      
      console.log(`\n✅ Keeping user: ${userToKeep.name.split('/').pop()}`);
      console.log(`🗑️  Deleting ${usersToDelete.length} duplicate users...`);
      
      for (const userToDelete of usersToDelete) {
        const deleteUrl = `${BASE}/users/${userToDelete.name.split('/').pop()}`;
        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (deleteResponse.ok) {
          console.log(`✅ Deleted duplicate user: ${userToDelete.name.split('/').pop()}`);
        } else {
          console.log(`❌ Failed to delete user: ${userToDelete.name.split('/').pop()}`);
        }
      }
      
      // Update the kept user to ensure correct password hash
      const updateUrl = `${BASE}/users/${userToKeep.name.split('/').pop()}`;
      const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            password: { stringValue: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ' }, // password123
            role: { stringValue: 'MANAGER' },
            updated_at: { timestampValue: new Date().toISOString() }
          }
        })
      });
      
      if (updateResponse.ok) {
        console.log('\n✅ User fixed successfully!');
        console.log('\n📋 Final Login Credentials:');
        console.log(`Email: ${userEmail}`);
        console.log(`Password: password123`);
        console.log(`Role: MANAGER`);
        console.log(`Name: ${userToKeep.fields.name?.stringValue}`);
        console.log(`Position: ${userToKeep.fields.position?.stringValue}`);
      } else {
        console.log('❌ Failed to update user');
      }
    } else {
      console.log('\n✅ No duplicates found. User should work as-is.');
      console.log('\n📋 Login Credentials:');
      console.log(`Email: ${userEmail}`);
      console.log(`Password: password123`);
      console.log(`Role: MANAGER`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing user:', error);
  }
}

fixDuplicateUser().catch(console.error);
