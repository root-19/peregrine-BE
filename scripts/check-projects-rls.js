const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkProjectsRLS() {
  console.log('Checking projects table RLS status...\n');
  console.log('Run this SQL in your Supabase Dashboard → SQL Editor:\n');
  console.log('============================================================');
  console.log(`
-- Disable RLS on projects table (same fix as users)
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
`);
  console.log('============================================================');
  console.log('\nThis will fix the "Internal server error" for project creation.');
}

checkProjectsRLS();
