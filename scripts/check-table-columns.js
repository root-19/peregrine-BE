const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkTableColumns() {
  console.log('🔍 Checking actual table columns...');
  
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Check users table structure
    console.log('\n📊 USERS TABLE COLUMNS:');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Users table error:', usersError);
    } else if (usersData && usersData.length > 0) {
      console.log('Available columns:', Object.keys(usersData[0]));
    }

    // Check projects table structure  
    console.log('\n📁 PROJECTS TABLE COLUMNS:');
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (projectsError) {
      console.log('❌ Projects table error:', projectsError);
    } else if (projectsData && projectsData.length > 0) {
      console.log('Available columns:', Object.keys(projectsData[0]));
    }

    // Check incidents table structure
    console.log('\n🚨 INCIDENTS TABLE COLUMNS:');
    const { data: incidentsData, error: incidentsError } = await supabase
      .from('incident_reports')
      .select('*')
      .limit(1);
    
    if (incidentsError) {
      console.log('❌ Incidents table error:', incidentsError);
    } else if (incidentsData && incidentsData.length > 0) {
      console.log('Available columns:', Object.keys(incidentsData[0]));
    }

  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkTableColumns();
