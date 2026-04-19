const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addAboutColumn() {
  console.log('Adding "about" column to users table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS about TEXT;`
  });

  if (error) {
    // Try direct SQL via REST if rpc doesn't work
    console.log('RPC not available, trying direct query...');
    const { data, error: error2 } = await supabase
      .from('users')
      .select('about')
      .limit(1);
    
    if (error2 && error2.message.includes('about')) {
      console.log('Column "about" does not exist yet.');
      console.log('Please run this SQL in your Supabase dashboard:');
      console.log('  ALTER TABLE users ADD COLUMN IF NOT EXISTS about TEXT;');
    } else {
      console.log('Column "about" already exists!');
    }
  } else {
    console.log('Column "about" added successfully!');
  }
}

addAboutColumn();
