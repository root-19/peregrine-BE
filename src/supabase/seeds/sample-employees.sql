-- Insert sample employees data
-- This will be automatically created when users are inserted due to the trigger
-- But we can also manually insert for existing users

-- Update existing users to have proper names for employee generation
UPDATE users SET 
  name = 'John Smith',
  department = 'Executive',
  position = 'Chief Operating Officer',
  hireDate = '2020-01-15'
WHERE email = 'wasieacuna@gmail.com';

UPDATE users SET 
  name = 'Sarah Johnson',
  department = 'Operations',
  position = 'Project Manager',
  hireDate = '2021-03-20'
WHERE email = 'manager@peregrine.com';

UPDATE users SET 
  name = 'Mike Wilson',
  department = 'Construction',
  position = 'Site Supervisor',
  hireDate = '2022-06-10'
WHERE email = 'employee@peregrine.com';

UPDATE users SET 
  name = 'Emily Davis',
  department = 'Human Resources',
  position = 'HR Manager',
  hireDate = '2020-05-12'
WHERE email = 'hr@peregrine.com';

UPDATE users SET 
  name = 'Robert Brown',
  department = 'Safety',
  position = 'HSE Officer',
  hireDate = '2021-08-25'
WHERE email = 'hse@peregrine.com';

UPDATE users SET 
  name = 'James Garcia',
  department = 'Construction',
  position = 'Foreman',
  hireDate = '2022-02-14'
WHERE email = 'foreman@peregrine.com';

UPDATE users SET 
  name = 'Lisa Martinez',
  department = 'Engineering',
  position = 'Site Engineer',
  hireDate = '2021-11-30'
WHERE email = 'engineer@peregrine.com';

UPDATE users SET 
  name = 'David Lee',
  department = 'Operations',
  position = 'Site Supervisor',
  hireDate = '2020-09-18'
WHERE email = 'supervisor@peregrine.com';

-- Manually insert employee records for existing users
INSERT INTO employees (
  employee_id,
  user_id,
  first_name,
  last_name,
  email,
  phone,
  department,
  position,
  role,
  hire_date,
  employee_type,
  status,
  salary,
  work_schedule,
  work_days,
  work_hours,
  sss_number,
  philhealth_number,
  pagibig_number,
  tin_number,
  emergency_contact_name,
  emergency_contact_phone,
  emergency_contact_relationship,
  requirements_completed
) VALUES
('EMP24001', (SELECT id FROM users WHERE email = 'wasieacuna@gmail.com'), 'John', 'Smith', 'wasieacuna@gmail.com', '+1234567890', 'Executive', 'Chief Operating Officer', 'COO', '2020-01-15', 'regular', 'active', 150000.00, 'regular', 'Monday-Friday', '8:00-17:00', '12-3456789-0', '12-3456789-1', '12-3456789-2', '123-456-789', 'Mary Smith', '+1234567891', 'Spouse', true),

('EMP24002', (SELECT id FROM users WHERE email = 'manager@peregrine.com'), 'Sarah', 'Johnson', 'manager@peregrine.com', '+1234567891', 'Operations', 'Project Manager', 'MANAGER', '2021-03-20', 'regular', 'active', 85000.00, 'regular', 'Monday-Friday', '8:00-17:00', '12-3456789-3', '12-3456789-4', '12-3456789-5', '123-456-790', 'Michael Johnson', '+1234567892', 'Father', true),

('EMP24003', (SELECT id FROM users WHERE email = 'employee@peregrine.com'), 'Mike', 'Wilson', 'employee@peregrine.com', '+1234567892', 'Construction', 'Site Supervisor', 'EMPLOYEE', '2022-06-10', 'regular', 'active', 45000.00, 'regular', 'Monday-Saturday', '7:00-16:00', '12-3456789-6', '12-3456789-7', '12-3456789-8', '123-456-791', 'Linda Wilson', '+1234567893', 'Mother', true),

('EMP24004', (SELECT id FROM users WHERE email = 'hr@peregrine.com'), 'Emily', 'Davis', 'hr@peregrine.com', '+1234567893', 'Human Resources', 'HR Manager', 'HR', '2020-05-12', 'regular', 'active', 75000.00, 'regular', 'Monday-Friday', '8:30-17:30', '12-3456789-9', '12-3456789-0', '12-3456789-1', '123-456-792', 'Robert Davis', '+1234567894', 'Father', true),

('EMP24005', (SELECT id FROM users WHERE email = 'hse@peregrine.com'), 'Robert', 'Brown', 'hse@peregrine.com', '+1234567894', 'Safety', 'HSE Officer', 'HSE', '2021-08-25', 'regular', 'active', 55000.00, 'flexible', 'Monday-Friday', '8:00-17:00', '12-3456789-2', '12-3456789-3', '12-3456789-4', '123-456-793', 'Susan Brown', '+1234567895', 'Wife', true),

('EMP24006', (SELECT id FROM users WHERE email = 'foreman@peregrine.com'), 'James', 'Garcia', 'foreman@peregrine.com', '+1234567895', 'Construction', 'Foreman', 'EMPLOYEE', '2022-02-14', 'regular', 'active', 42000.00, 'night_shift', 'Monday-Saturday', '20:00-4:00', '12-3456789-5', '12-3456789-6', '12-3456789-7', '123-456-794', 'Maria Garcia', '+1234567896', 'Spouse', true),

('EMP24007', (SELECT id FROM users WHERE email = 'engineer@peregrine.com'), 'Lisa', 'Martinez', 'engineer@peregrine.com', '+1234567896', 'Engineering', 'Site Engineer', 'EMPLOYEE', '2021-11-30', 'regular', 'active', 65000.00, 'regular', 'Monday-Friday', '8:00-17:00', '12-3456789-8', '12-3456789-9', '12-3456789-0', '123-456-795', 'Carlos Martinez', '+1234567897', 'Father', true),

('EMP24008', (SELECT id FROM users WHERE email = 'supervisor@peregrine.com'), 'David', 'Lee', 'supervisor@peregrine.com', '+1234567897', 'Operations', 'Site Supervisor', 'MANAGER', '2020-09-18', 'regular', 'active', 70000.00, 'regular', 'Monday-Friday', '8:00-17:00', '12-3456789-1', '12-3456789-2', '12-3456789-3', '123-456-796', 'Jennifer Lee', '+1234567898', 'Wife', true)

ON CONFLICT (user_id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  hire_date = EXCLUDED.hire_date,
  employee_type = EXCLUDED.employee_type,
  status = EXCLUDED.status,
  salary = EXCLUDED.salary,
  work_schedule = EXCLUDED.work_schedule,
  work_days = EXCLUDED.work_days,
  work_hours = EXCLUDED.work_hours,
  sss_number = EXCLUDED.sss_number,
  philhealth_number = EXCLUDED.philhealth_number,
  pagibig_number = EXCLUDED.pagibig_number,
  tin_number = EXCLUDED.tin_number,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  requirements_completed = EXCLUDED.requirements_completed,
  updated_at = NOW();
