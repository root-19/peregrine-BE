const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function disableTrigger() {
  console.log('⚠️  Temporarily disabling the updated_at trigger to fix profile updates...');
  console.log('Run this SQL in your Supabase Dashboard → SQL Editor:\n');
  console.log('============================================================');
  console.log(`
-- Disable the trigger that might interfere with updates
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
`);
  console.log('============================================================');
  console.log('\nAfter running the SQL, try updating your profile again.');
  console.log('If it works, we can create a better trigger later.');
}

disableTrigger();
