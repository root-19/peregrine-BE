const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('SUPABASE_URL:', supabaseUrl ? '✅ SET' : '❌ MISSING');
console.log('ANON_KEY:', anonKey ? '✅ SET' : '❌ MISSING');
console.log('SERVICE_ROLE_KEY:', serviceKey ? '✅ SET' : '❌ MISSING');
console.log('Keys match:', anonKey === serviceKey ? '⚠️  SAME KEY (service role not set properly)' : '✅ Different keys');

const userId = '07b7948e-413a-48c7-aefb-1b1c478f4c58';

async function test() {
  // Test 1: Read with anon key
  const supabase = createClient(supabaseUrl, anonKey);
  console.log('\n--- Test 1: SELECT with anon key ---');
  const { data: readUser, error: readErr } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', userId)
    .single();
  console.log('Read result:', readUser || readErr);

  // Test 2: Read all users to find if ID exists
  console.log('\n--- Test 2: List all user IDs ---');
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, name, email');
  if (allUsers) {
    allUsers.forEach(u => console.log(`  ${u.id} - ${u.name} (${u.email})`));
  }

  // Test 3: Update with service role key
  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  console.log('\n--- Test 3: UPDATE with service role key ---');
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('users')
    .update({ name: 'Test Update' })
    .eq('id', userId)
    .select('id, name')
    .single();
  console.log('Update result:', updated || updateErr);

  // Test 4: Update without .single() to see how many rows matched
  console.log('\n--- Test 4: UPDATE without .single() ---');
  const { data: updated2, error: updateErr2 } = await supabaseAdmin
    .from('users')
    .update({ name: 'John Smith' })
    .eq('id', userId)
    .select('id, name');
  console.log('Update result:', updated2, updateErr2);
}

test();
