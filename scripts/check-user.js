const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkUser() {
  console.log('🔍 Checking if wasieacuna@gmail.com exists in database...');
  
  try {
    console.log('🔧 Environment check:');
    console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('❌ Missing environment variables');
      return;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'wasieacuna@gmail.com')
      .single();
    
    if (error) {
      console.log('❌ Database error:', error);
      if (error.code === 'PGRST116') {
        console.log('📝 User wasieacuna@gmail.com does NOT exist in database');
        console.log('💡 You need to run the seed script to create users');
      } else {
        console.log('🔧 Other error - check database connection');
      }
    } else {
      console.log('✅ User found in database:');
      console.log('- Email:', data.email);
      console.log('- Name:', data.name);
      console.log('- Role:', data.role);
      console.log('- Status:', data.status);
      console.log('- ID:', data.id);
      console.log('- Department:', data.department || 'Not set');
      console.log('- Position:', data.position || 'Not set');
      console.log('- Created:', data.created_at);
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message);
  }
}

checkUser();
