const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Insert sample users
    console.log('📝 Inserting sample users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .insert([
        {
          email: 'wasieacuna@gmail.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQ',
          name: 'John Smith',
          role: 'COO',
          status: 'active'
        },
        {
          email: 'manager@peregrine.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQ',
          name: 'Sarah Johnson',
          role: 'MANAGER',
          status: 'active',
          department: 'Operations',
          position: 'Project Manager',
          hireDate: '2021-03-20',
          phone: '+1234567891'
        },
        {
          email: 'employee@peregrine.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQ',
          name: 'Mike Wilson',
          role: 'EMPLOYEE',
          status: 'active',
          department: 'Construction',
          position: 'Site Supervisor',
          hireDate: '2022-06-10',
          phone: '+1234567892'
        },
        {
          email: 'hr@peregrine.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQ',
          name: 'Emily Davis',
          role: 'HR',
          status: 'active',
          department: 'Human Resources',
          position: 'HR Manager',
          hireDate: '2020-05-12',
          phone: '+1234567893'
        },
        {
          email: 'hse@peregrine.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQ',
          name: 'Robert Brown',
          role: 'HSE',
          status: 'active',
          department: 'Safety',
          position: 'HSE Officer',
          hireDate: '2021-08-25',
          phone: '+1234567894'
        },
        {
          email: 'foreman@peregrine.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQ',
          name: 'James Garcia',
          role: 'EMPLOYEE',
          status: 'active',
          department: 'Construction',
          position: 'Foreman',
          hireDate: '2022-02-14',
          phone: '+1234567895'
        },
        {
          email: 'engineer@peregrine.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQ',
          name: 'Lisa Martinez',
          role: 'EMPLOYEE',
          status: 'active',
          department: 'Engineering',
          position: 'Site Engineer',
          hireDate: '2021-11-30',
          phone: '+1234567896'
        },
        {
          email: 'supervisor@peregrine.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQ',
          name: 'David Lee',
          role: 'MANAGER',
          status: 'active',
          department: 'Operations',
          position: 'Site Supervisor',
          hireDate: '2020-09-18',
          phone: '+1234567897'
        }
      ])
      .select();

    if (usersError) {
      console.error('❌ Error inserting users:', usersError);
      throw usersError;
    }

    console.log(`✅ Successfully inserted ${users.length} users`);

    // Insert sample projects
    console.log('📁 Inserting sample projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .insert([
        {
          name: 'Skyline Tower Construction',
          description: 'Construction of 20-story commercial building with retail spaces',
          status: 'in_progress',
          startDate: '2024-01-15',
          endDate: '2024-12-31',
          budget: 5000000,
          location: 'Downtown District',
          client: 'ABC Development Corp',
          managerId: users[1].id, // Sarah Johnson
          teamMembers: [users[2].id, users[5].id, users[6].id] // Mike, James, Lisa
        },
        {
          name: 'Highway Bridge Project',
          description: 'Construction of new highway bridge connecting north and south districts',
          status: 'planning',
          startDate: '2024-03-01',
          endDate: '2024-11-30',
          budget: 3500000,
          location: 'North-South Corridor',
          client: 'Department of Transportation',
          managerId: users[7].id, // David Lee
          teamMembers: [users[5].id, users[6].id] // James, Lisa
        },
        {
          name: 'Industrial Complex',
          description: 'Development of industrial warehouse complex with 5 buildings',
          status: 'completed',
          startDate: '2023-06-01',
          endDate: '2024-01-15',
          budget: 2800000,
          location: 'Industrial Zone',
          client: 'Logistics Solutions Inc',
          managerId: users[1].id, // Sarah Johnson
          teamMembers: [users[2].id] // Mike Wilson
        },
        {
          name: 'Residential Complex',
          description: 'Construction of 50-unit residential apartment complex',
          status: 'on_hold',
          startDate: '2024-02-15',
          endDate: '2024-10-30',
          budget: 4200000,
          location: 'Suburban Area',
          client: 'Home Builders LLC',
          managerId: users[7].id, // David Lee
          teamMembers: [users[5].id] // James Garcia
        }
      ])
      .select();

    if (projectsError) {
      console.error('❌ Error inserting projects:', projectsError);
      throw projectsError;
    }

    console.log(`✅ Successfully inserted ${projects.length} projects`);

    // Insert sample incident reports
    console.log('🚨 Inserting sample incident reports...');
    const { data: incidents, error: incidentsError } = await supabase
      .from('incident_reports')
      .insert([
        {
          title: 'Fall from Scaffold',
          description: 'Worker slipped and fell from 10-foot scaffold while installing framing',
          severity: 'high',
          status: 'investigating',
          reportedBy: users[2].id, // Mike Wilson
          assignedTo: users[3].id, // Robert Brown
          location: 'Skyline Tower - Floor 5',
          dateOccurred: '2024-02-10',
          category: 'Safety Accident',
          actions: ['Immediate medical attention provided', 'Site safety meeting conducted', 'Scaffold inspection scheduled']
        },
        {
          title: 'Equipment Malfunction',
          description: 'Excavator hydraulic system failed during foundation work',
          severity: 'medium',
          status: 'resolved',
          reportedBy: users[5].id, // James Garcia
          assignedTo: users[1].id, // Sarah Johnson
          location: 'Highway Bridge - Site A',
          dateOccurred: '2024-02-08',
          category: 'Equipment Failure',
          actions: ['Equipment removed from service', 'Maintenance team called', 'Backup equipment deployed']
        },
        {
          title: 'Material Shortage',
          description: 'Steel delivery delayed by 3 days affecting project timeline',
          severity: 'low',
          status: 'open',
          reportedBy: users[1].id, // Sarah Johnson
          assignedTo: users[1].id, // Sarah Johnson
          location: 'Skyline Tower - Storage',
          dateOccurred: '2024-02-12',
          category: 'Logistics',
          actions: ['Contacted supplier', 'Rescheduled work activities', 'Updated project timeline']
        },
        {
          title: 'Near Miss',
          description: 'Crane load nearly struck workers due to high winds',
          severity: 'critical',
          status: 'investigating',
          reportedBy: users[6].id, // Lisa Martinez
          assignedTo: users[3].id, // Robert Brown
          location: 'Industrial Complex - Building 3',
          dateOccurred: '2024-02-09',
          category: 'Safety Incident',
          actions: ['Work stopped immediately', 'All personnel evacuated', 'Weather assessment conducted', 'New safety procedures implemented']
        }
      ])
      .select();

    if (incidentsError) {
      console.error('❌ Error inserting incidents:', incidentsError);
      throw incidentsError;
    }

    console.log(`✅ Successfully inserted ${incidents.length} incident reports`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Projects: ${projects.length}`);
    console.log(`- Incidents: ${incidents.length}`);
    console.log('\n🔑 Login Credentials:');
    console.log(`- Email: wasieacuna@gmail.com (COO)`);
    console.log(`- Email: manager@peregrine.com (Manager)`);
    console.log(`- Email: employee@peregrine.com (Employee)`);
    console.log(`- Email: hr@peregrine.com (HR)`);
    console.log(`- Email: hse@peregrine.com (HSE)`);
    console.log(`- Email: foreman@peregrine.com (Employee)`);
    console.log(`- Email: engineer@peregrine.com (Employee)`);
    console.log(`- Email: supervisor@peregrine.com (Manager)`);
    console.log('\n🔐 Password for all users: password123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
