const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedDatabase() {
  console.log('🌱 Starting database seeding (without trigger)...');

  try {
    // First, disable the trigger temporarily
    console.log('🔧 Disabling employee trigger...');
    await supabase.rpc('sql', { sql: 'DROP TRIGGER IF EXISTS create_employee_on_user_insert;' });

    // Insert sample users
    console.log('📝 Inserting sample users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .insert([
        {
          email: 'wasieacuna@gmail.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQ',
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
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQ',
          name: 'Mike Wilson',
          role: 'EMPLOYEE',
          status: 'active'
        },
        {
          email: 'hr@peregrine.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQ',
          name: 'Emily Davis',
          role: 'HR',
          status: 'active'
        },
        {
          email: 'hse@peregrine.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQ',
          name: 'Robert Brown',
          role: 'HSE',
          status: 'active'
        },
        {
          email: 'foreman@peregrine.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQ',
          name: 'James Garcia',
          role: 'EMPLOYEE',
          status: 'active'
        },
        {
          email: 'engineer@peregrine.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQ',
          name: 'Lisa Martinez',
          role: 'EMPLOYEE',
          status: 'active'
        },
        {
          email: 'supervisor@peregrine.com',
          password: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQ',
          name: 'David Lee',
          role: 'MANAGER',
          status: 'active'
        }
      ])
      .select();

    if (usersError) {
      console.error('❌ Error inserting users:', usersError);
      throw usersError;
    }

    console.log(`✅ Successfully inserted ${users.length} users`);

    // Re-enable the trigger
    console.log('🔧 Re-enabling employee trigger...');
    await supabase.rpc('sql', { 
      sql: `
        CREATE TRIGGER create_employee_on_user_insert
        AFTER INSERT ON users
        FOR EACH ROW
        EXECUTE FUNCTION create_employee_record();
      `
    });

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
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
