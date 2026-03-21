require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function toVal(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return { integerValue: v.toString() };
    return { doubleValue: v };
  }
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toVal) } };
  if (typeof v === 'object') {
    const fields = {};
    for (const k of Object.keys(v)) fields[k] = toVal(v[k]);
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

function toFields(data) {
  const fields = {};
  for (const k of Object.keys(data)) fields[k] = toVal(data[k]);
  return fields;
}

async function addDoc(collection, data) {
  const url = `${BASE}/${collection}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`❌ Failed to add to ${collection}:`, err);
    return null;
  }
  const doc = await res.json();
  const id = doc.name.split('/').pop();
  console.log(`✅ Added to ${collection}: ${id}`);
  return id;
}

async function seed() {
  console.log(`\n🔥 Seeding Firebase Firestore for project: ${PROJECT_ID}\n`);
  const now = new Date().toISOString();

  // ========== USERS ==========
  console.log('--- Seeding Users ---');
  const users = [
    { email: 'wasieacuna@gmail.com', password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', name: 'John Smith', role: 'COO', status: 'active', department: 'Executive', position: 'Chief Operating Officer', hireDate: '2020-01-15', phone: '+1234567890' },
    { email: 'manager@gmail.com', password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', name: 'Sarah Johnson', role: 'MANAGER', status: 'active', department: 'Operations', position: 'Project Manager', hireDate: '2021-03-20', phone: '+1234567891' },
    { email: 'employee@gmail.com', password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', name: 'Mike Wilson', role: 'EMPLOYEE', status: 'active', department: 'Construction', position: 'Site Supervisor', hireDate: '2022-06-10', phone: '+1234567892' },
    { email: 'hr@gmail.com', password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', name: 'Emily Davis', role: 'HR', status: 'active', department: 'Human Resources', position: 'HR Manager', hireDate: '2020-05-12', phone: '+1234567893' },
    { email: 'hse@gmail.com', password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', name: 'Robert Brown', role: 'HSE', status: 'active', department: 'Safety', position: 'HSE Officer', hireDate: '2021-08-25', phone: '+1234567894' },
    { email: 'foreman@gmail.com', password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', name: 'James Garcia', role: 'EMPLOYEE', status: 'active', department: 'Construction', position: 'Foreman', hireDate: '2022-02-14', phone: '+1234567895' },
    { email: 'engineer@gmail.com', password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', name: 'Lisa Martinez', role: 'EMPLOYEE', status: 'active', department: 'Engineering', position: 'Site Engineer', hireDate: '2021-11-30', phone: '+1234567896' },
    { email: 'supervisor@gmail.com', password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', name: 'David Lee', role: 'MANAGER', status: 'active', department: 'Operations', position: 'Site Supervisor', hireDate: '2020-09-18', phone: '+1234567897' },
    { email: 'dmp@gmail.com', password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', name: 'DMP Site Manager', role: 'SITE_MANAGER', status: 'active', department: 'Site Management', position: 'Site Manager', hireDate: '2023-01-10', phone: '+1234567898' },
  ];

  const userIds = {};
  for (const u of users) {
    const id = await addDoc('users', {
      ...u,
      about: '',
      profileimage: '',
      created_at: now,
      updated_at: now,
    });
    if (id) userIds[u.email] = id;
  }

  // ========== PROJECTS ==========
  console.log('\n--- Seeding Projects ---');
  const projects = [
    {
      name: 'Skyline Tower Construction',
      description: 'Construction of 20-story commercial building with retail spaces',
      status: 'in_progress',
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      budget: 5000000,
      location: 'Downtown District',
      client: 'ABC Development Corp',
      managerId: userIds['manager@gmail.com'] || '',
      teamMembers: [userIds['employee@gmail.com'], userIds['foreman@gmail.com'], userIds['engineer@gmail.com']].filter(Boolean),
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
      managerId: userIds['supervisor@gmail.com'] || '',
      teamMembers: [userIds['foreman@gmail.com'], userIds['engineer@gmail.com']].filter(Boolean),
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
      managerId: userIds['manager@gmail.com'] || '',
      teamMembers: [userIds['employee@gmail.com']].filter(Boolean),
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
      managerId: userIds['supervisor@gmail.com'] || '',
      teamMembers: [userIds['foreman@gmail.com']].filter(Boolean),
    },
  ];

  for (const p of projects) {
    await addDoc('projects', { ...p, created_at: now, updated_at: now });
  }

  // ========== INCIDENT REPORTS ==========
  console.log('\n--- Seeding Incident Reports ---');
  const incidents = [
    {
      title: 'Fall from Scaffold',
      description: 'Worker slipped and fell from 10-foot scaffold while installing framing',
      severity: 'high',
      status: 'investigating',
      reportedBy: userIds['employee@gmail.com'] || '',
      assignedTo: userIds['hse@gmail.com'] || '',
      location: 'Skyline Tower - Floor 5',
      dateOccurred: '2024-02-10',
      category: 'Safety Accident',
      actions: ['Immediate medical attention provided', 'Site safety meeting conducted', 'Scaffold inspection scheduled'],
      attachments: [],
    },
    {
      title: 'Equipment Malfunction',
      description: 'Excavator hydraulic system failed during foundation work',
      severity: 'medium',
      status: 'resolved',
      reportedBy: userIds['foreman@gmail.com'] || '',
      assignedTo: userIds['manager@gmail.com'] || '',
      location: 'Highway Bridge - Site A',
      dateOccurred: '2024-02-08',
      category: 'Equipment Failure',
      actions: ['Equipment removed from service', 'Maintenance team called', 'Backup equipment deployed'],
      attachments: [],
    },
    {
      title: 'Material Shortage',
      description: 'Steel delivery delayed by 3 days affecting project timeline',
      severity: 'low',
      status: 'open',
      reportedBy: userIds['manager@gmail.com'] || '',
      assignedTo: userIds['manager@gmail.com'] || '',
      location: 'Skyline Tower - Storage',
      dateOccurred: '2024-02-12',
      category: 'Logistics',
      actions: ['Contacted supplier', 'Rescheduled work activities', 'Updated project timeline'],
      attachments: [],
    },
    {
      title: 'Near Miss',
      description: 'Crane load nearly struck workers due to high winds',
      severity: 'critical',
      status: 'investigating',
      reportedBy: userIds['engineer@gmail.com'] || '',
      assignedTo: userIds['hse@gmail.com'] || '',
      location: 'Industrial Complex - Building 3',
      dateOccurred: '2024-02-09',
      category: 'Safety Incident',
      actions: ['Work stopped immediately', 'All personnel evacuated', 'Weather assessment conducted', 'New safety procedures implemented'],
      attachments: [],
    },
  ];

  for (const i of incidents) {
    await addDoc('incident_reports', { ...i, created_at: now, updated_at: now });
  }

  // ========== EMPLOYEES ==========
  console.log('\n--- Seeding Employees ---');
  const employees = [
    { employee_id: 'EMP24001', user_id: userIds['wasieacuna@gmail.com'] || '', first_name: 'John', last_name: 'Smith', email: 'wasieacuna@gmail.com', phone: '+1234567890', department: 'Executive', position: 'Chief Operating Officer', role: 'COO', hire_date: '2020-01-15', employee_type: 'regular', status: 'active', salary: 150000, work_schedule: 'regular', work_days: 'Monday-Friday', work_hours: '8:00-17:00', sss_number: '12-3456789-0', philhealth_number: '12-3456789-1', pagibig_number: '12-3456789-2', tin_number: '123-456-789', emergency_contact_name: 'Mary Smith', emergency_contact_phone: '+1234567891', emergency_contact_relationship: 'Spouse', requirements_completed: true },
    { employee_id: 'EMP24002', user_id: userIds['manager@gmail.com'] || '', first_name: 'Sarah', last_name: 'Johnson', email: 'manager@gmail.com', phone: '+1234567891', department: 'Operations', position: 'Project Manager', role: 'MANAGER', hire_date: '2021-03-20', employee_type: 'regular', status: 'active', salary: 85000, work_schedule: 'regular', work_days: 'Monday-Friday', work_hours: '8:00-17:00', sss_number: '12-3456789-3', philhealth_number: '12-3456789-4', pagibig_number: '12-3456789-5', tin_number: '123-456-790', emergency_contact_name: 'Michael Johnson', emergency_contact_phone: '+1234567892', emergency_contact_relationship: 'Father', requirements_completed: true },
    { employee_id: 'EMP24003', user_id: userIds['employee@gmail.com'] || '', first_name: 'Mike', last_name: 'Wilson', email: 'employee@gmail.com', phone: '+1234567892', department: 'Construction', position: 'Site Supervisor', role: 'EMPLOYEE', hire_date: '2022-06-10', employee_type: 'regular', status: 'active', salary: 45000, work_schedule: 'regular', work_days: 'Monday-Saturday', work_hours: '7:00-16:00', sss_number: '12-3456789-6', philhealth_number: '12-3456789-7', pagibig_number: '12-3456789-8', tin_number: '123-456-791', emergency_contact_name: 'Linda Wilson', emergency_contact_phone: '+1234567893', emergency_contact_relationship: 'Mother', requirements_completed: true },
    { employee_id: 'EMP24004', user_id: userIds['hr@gmail.com'] || '', first_name: 'Emily', last_name: 'Davis', email: 'hr@gmail.com', phone: '+1234567893', department: 'Human Resources', position: 'HR Manager', role: 'HR', hire_date: '2020-05-12', employee_type: 'regular', status: 'active', salary: 75000, work_schedule: 'regular', work_days: 'Monday-Friday', work_hours: '8:30-17:30', sss_number: '12-3456789-9', philhealth_number: '12-3456789-0', pagibig_number: '12-3456789-1', tin_number: '123-456-792', emergency_contact_name: 'Robert Davis', emergency_contact_phone: '+1234567894', emergency_contact_relationship: 'Father', requirements_completed: true },
    { employee_id: 'EMP24005', user_id: userIds['hse@gmail.com'] || '', first_name: 'Robert', last_name: 'Brown', email: 'hse@gmail.com', phone: '+1234567894', department: 'Safety', position: 'HSE Officer', role: 'HSE', hire_date: '2021-08-25', employee_type: 'regular', status: 'active', salary: 55000, work_schedule: 'flexible', work_days: 'Monday-Friday', work_hours: '8:00-17:00', sss_number: '12-3456789-2', philhealth_number: '12-3456789-3', pagibig_number: '12-3456789-4', tin_number: '123-456-793', emergency_contact_name: 'Susan Brown', emergency_contact_phone: '+1234567895', emergency_contact_relationship: 'Wife', requirements_completed: true },
    { employee_id: 'EMP24006', user_id: userIds['foreman@gmail.com'] || '', first_name: 'James', last_name: 'Garcia', email: 'foreman@gmail.com', phone: '+1234567895', department: 'Construction', position: 'Foreman', role: 'EMPLOYEE', hire_date: '2022-02-14', employee_type: 'regular', status: 'active', salary: 42000, work_schedule: 'night_shift', work_days: 'Monday-Saturday', work_hours: '20:00-4:00', sss_number: '12-3456789-5', philhealth_number: '12-3456789-6', pagibig_number: '12-3456789-7', tin_number: '123-456-794', emergency_contact_name: 'Maria Garcia', emergency_contact_phone: '+1234567896', emergency_contact_relationship: 'Spouse', requirements_completed: true },
    { employee_id: 'EMP24007', user_id: userIds['engineer@gmail.com'] || '', first_name: 'Lisa', last_name: 'Martinez', email: 'engineer@gmail.com', phone: '+1234567896', department: 'Engineering', position: 'Site Engineer', role: 'EMPLOYEE', hire_date: '2021-11-30', employee_type: 'regular', status: 'active', salary: 65000, work_schedule: 'regular', work_days: 'Monday-Friday', work_hours: '8:00-17:00', sss_number: '12-3456789-8', philhealth_number: '12-3456789-9', pagibig_number: '12-3456789-0', tin_number: '123-456-795', emergency_contact_name: 'Carlos Martinez', emergency_contact_phone: '+1234567897', emergency_contact_relationship: 'Father', requirements_completed: true },
    { employee_id: 'EMP24008', user_id: userIds['supervisor@gmail.com'] || '', first_name: 'David', last_name: 'Lee', email: 'supervisor@gmail.com', phone: '+1234567897', department: 'Operations', position: 'Site Supervisor', role: 'MANAGER', hire_date: '2020-09-18', employee_type: 'regular', status: 'active', salary: 70000, work_schedule: 'regular', work_days: 'Monday-Friday', work_hours: '8:00-17:00', sss_number: '12-3456789-1', philhealth_number: '12-3456789-2', pagibig_number: '12-3456789-3', tin_number: '123-456-796', emergency_contact_name: 'Jennifer Lee', emergency_contact_phone: '+1234567898', emergency_contact_relationship: 'Wife', requirements_completed: true },
  ];

  for (const e of employees) {
    await addDoc('employees', { ...e, created_at: now, updated_at: now });
  }

  console.log('\n🎉 Seeding complete!');
  console.log('\nUser IDs:');
  for (const [email, id] of Object.entries(userIds)) {
    console.log(`  ${email} → ${id}`);
  }
}

seed().catch(console.error);
