const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkRLSPolicies() {
  console.log('Checking RLS policies on projects table...\n');
  
  // Check if RLS is enabled
  const { data: rlsStatus, error: rlsError } = await supabase
    .from('projects')
    .select('*')
    .limit(1);
    
  if (rlsError) {
    console.log('RLS Error:', rlsError.message);
    console.log('This might indicate RLS is blocking the query');
  }
  
  console.log('\nTo check RLS policies in Supabase Dashboard, go to:');
  console.log('1. Authentication → Policies');
  console.log('2. Look for policies on the "projects" table');
  console.log('\nCommon RLS issues:');
  console.log('- RLS enabled but no policies allow INSERT');
  console.log('- Policies only allow specific users/roles');
  console.log('- Policies require specific conditions');
  
  console.log('\nTo fix RLS issues, run this SQL:');
  console.log('============================================================');
  console.log(`
-- Check if RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'projects';

-- Disable RLS completely (quick fix)
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- OR create a permissive policy (better approach)
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
CREATE POLICY "projects_insert_policy" ON projects
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "projects_select_policy" ON projects;
CREATE POLICY "projects_select_policy" ON projects
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "projects_update_policy" ON projects;
CREATE POLICY "projects_update_policy" ON projects
  FOR UPDATE USING (true);
`);
  console.log('============================================================');
}

checkRLSPolicies();
