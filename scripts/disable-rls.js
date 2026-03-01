const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function disableRLS() {
  console.log('⚠️  Disabling RLS on users table as quick fix...');
  console.log('Run this SQL in your Supabase Dashboard → SQL Editor:\n');
  console.log('============================================================');
  console.log(`
-- Disable RLS entirely on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
`);
  console.log('============================================================');
  console.log('\nAfter running the SQL, profile updates will work immediately.');
  console.log('This is safe for development. For production, we can fix RLS policies later.');
}

disableRLS();
