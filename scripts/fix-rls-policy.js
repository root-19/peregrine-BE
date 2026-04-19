const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function fixRLS() {
  console.log('⚠️  Your SUPABASE_SERVICE_ROLE_KEY is the same as SUPABASE_ANON_KEY.');
  console.log('This means supabaseAdmin cannot bypass RLS.\n');
  console.log('To fix this, run the following SQL in your Supabase Dashboard → SQL Editor:\n');
  console.log('============================================================');
  console.log(`
-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create a permissive update policy (allows backend to update any user)
CREATE POLICY "Allow all updates on users" ON users FOR UPDATE USING (true) WITH CHECK (true);
`);
  console.log('============================================================');
  console.log('\nOr to fully disable RLS on users table:');
  console.log('  ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
  console.log('\nAfter running the SQL, the profile update will work.');
}

fixRLS();
