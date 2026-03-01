const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkProjectsColumns() {
  console.log('Checking projects table structure...\n');
  
  // Check if projects table exists and its columns
  const { data: columns, error } = await supabase
    .from('projects')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error accessing projects table:', error);
    return;
  }
  
  if (columns && columns.length > 0) {
    console.log('Projects table columns found:');
    console.log(Object.keys(columns[0]));
  } else {
    console.log('Projects table is empty or structure check failed');
  }
  
  console.log('\nTo fix teamMembers array issue, run this SQL:');
  console.log('============================================================');
  console.log(`
-- Make sure teamMembers column accepts UUID arrays
ALTER TABLE projects 
ALTER COLUMN teamMembers TYPE uuid[] USING teamMembers::uuid[];

-- Or if column doesn't exist, add it
ALTER TABLE projects ADD COLUMN IF NOT EXISTS teamMembers uuid[];

-- Make sure other required columns have defaults
ALTER TABLE projects 
ALTER COLUMN id SET DEFAULT gen_random_uuid(),
ALTER COLUMN created_at SET DEFAULT now(),
ALTER COLUMN updated_at SET DEFAULT now();
`);
  console.log('============================================================');
}

checkProjectsColumns();
