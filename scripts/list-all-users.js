const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function listAllUsers() {
  console.log('👥 Listing all users in database...');
  
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error:', error);
      return;
    }

    console.log(`\n📊 Found ${data.length} users:`);
    console.log('─'.repeat(80));
    
    data.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👔 Role: ${user.role}`);
      console.log(`   📊 Status: ${user.status}`);
      console.log(`   🏢 Department: ${user.department || 'Not set'}`);
      console.log(`   💼 Position: ${user.position || 'Not set'}`);
      console.log(`   📅 Created: ${user.created_at}`);
      console.log('─'.repeat(80));
    });

    console.log(`\n🔑 Login Credentials (Password: password123):`);
    data.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });

  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

listAllUsers();
