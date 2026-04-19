const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function quickSeed() {
  console.log('🌱 Quick seeding database...');

  try {
    // Disable trigger temporarily
    await supabase.rpc('sql', { sql: 'DROP TRIGGER IF EXISTS create_employee_on_user_insert;' });

    // Insert users
    console.log('📝 Inserting users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .insert([
        {
          email: 'wasieacuna@gmail.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQ',
          name: 'John Smith',
          role: 'COO',
          status: 'active'
        },
        {
          email: 'manager@peregrine.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQ',
          name: 'Sarah Johnson',
          role: 'MANAGER',
          status: 'active'
        },
        {
          email: 'employee@peregrine.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQ',
          name: 'Mike Wilson',
          role: 'EMPLOYEE',
          status: 'active'
        }
      ])
      .select();

    if (usersError) {
      console.error('❌ Users error:', usersError);
      throw usersError;
    }

    console.log(`✅ Inserted ${users.length} users`);

    // Insert projects
    console.log('📁 Inserting projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .insert([
        {
          name: 'Skyline Tower Construction',
          description: 'Construction of 20-story commercial building',
          status: 'in_progress',
          startDate: '2024-01-15',
          endDate: '2024-12-31',
          budget: 5000000,
          location: 'Downtown District',
          client: 'ABC Development Corp',
          managerId: users[1].id
        },
        {
          name: 'Highway Bridge Project',
          description: 'Construction of new highway bridge',
          status: 'planning',
          startDate: '2024-03-01',
          endDate: '2024-11-30',
          budget: 3500000,
          location: 'North-South Corridor',
          client: 'Department of Transportation',
          managerId: users[0].id
        }
      ])
      .select();

    if (projectsError) {
      console.error('❌ Projects error:', projectsError);
      throw projectsError;
    }

    console.log(`✅ Inserted ${projects.length} projects`);

    // Insert incidents
    console.log('🚨 Inserting incidents...');
    const { data: incidents, error: incidentsError } = await supabase
      .from('incident_reports')
      .insert([
        {
          title: 'Fall from Scaffold',
          description: 'Worker slipped and fell from 10-foot scaffold',
          severity: 'high',
          status: 'investigating',
          reportedBy: users[2].id,
          assignedTo: users[0].id,
          location: 'Skyline Tower - Floor 5',
          dateOccurred: '2024-02-10',
          category: 'Safety Accident'
        },
        {
          title: 'Equipment Malfunction',
          description: 'Excavator hydraulic system failed',
          severity: 'medium',
          status: 'resolved',
          reportedBy: users[2].id,
          assignedTo: users[1].id,
          location: 'Highway Bridge - Site A',
          dateOccurred: '2024-02-08',
          category: 'Equipment Failure'
        }
      ])
      .select();

    if (incidentsError) {
      console.error('❌ Incidents error:', incidentsError);
      throw incidentsError;
    }

    console.log(`✅ Inserted ${incidents.length} incidents`);

    // Re-enable trigger
    await supabase.rpc('sql', { 
      sql: `
        CREATE TRIGGER create_employee_on_user_insert
        AFTER INSERT ON users
        FOR EACH ROW
        EXECUTE FUNCTION create_employee_record();
      `
    });

    console.log('🎉 Quick seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Projects: ${projects.length}`);
    console.log(`- Incidents: ${incidents.length}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

quickSeed();
