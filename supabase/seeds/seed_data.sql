-- Insert sample users with hashed passwords
-- Password for all users: "password123"

INSERT INTO users_app (email, password, name, role, status, department, position, hireDate, phone) VALUES
('wasieacuna@gmail.com', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'John Smith', 'COO', 'active', 'Executive', 'Chief Operating Officer', '2020-01-15', '+1234567890'),
('manager@peregrine.com', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'Sarah Johnson', 'MANAGER', 'active', 'Operations', 'Project Manager', '2021-03-20', '+1234567891'),
('employee@peregrine.com', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'Mike Wilson', 'EMPLOYEE', 'active', 'Construction', 'Site Supervisor', '2022-06-10', '+1234567892'),
('hr@peregrine.com', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'Emily Davis', 'HR', 'active', 'Human Resources', 'HR Manager', '2020-05-12', '+1234567893'),
('hse@peregrine.com', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'Robert Brown', 'HSE', 'active', 'Safety', 'HSE Officer', '2021-08-25', '+1234567894'),
('foreman@peregrine.com', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'James Garcia', 'EMPLOYEE', 'active', 'Construction', 'Foreman', '2022-02-14', '+1234567895'),
('engineer@peregrine.com', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'Lisa Martinez', 'EMPLOYEE', 'active', 'Engineering', 'Site Engineer', '2021-11-30', '+1234567896'),
('supervisor@peregrine.com', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'David Lee', 'MANAGER', 'active', 'Operations', 'Site Supervisor', '2020-09-18', '+1234567897');

-- Insert sample projects
INSERT INTO projects (name, description, status, startDate, endDate, budget, location, client, managerId, teamMembers) VALUES
('Skyline Tower Construction', 'Construction of 20-story commercial building with retail spaces', 'in_progress', '2024-01-15', '2024-12-31', 5000000, 'Downtown District', 'ABC Development Corp', (SELECT id FROM users WHERE email = 'manager@peregrine.com'), ARRAY[(SELECT id FROM users WHERE email = 'employee@peregrine.com'), (SELECT id FROM users WHERE email = 'foreman@peregrine.com'), (SELECT id FROM users WHERE email = 'engineer@peregrine.com')]),
('Highway Bridge Project', 'Construction of new highway bridge connecting north and south districts', 'planning', '2024-03-01', '2024-11-30', 3500000, 'North-South Corridor', 'Department of Transportation', (SELECT id FROM users WHERE email = 'supervisor@peregrine.com'), ARRAY[(SELECT id FROM users WHERE email = 'foreman@peregrine.com'), (SELECT id FROM users WHERE email = 'engineer@peregrine.com')]),
('Industrial Complex', 'Development of industrial warehouse complex with 5 buildings', 'completed', '2023-06-01', '2024-01-15', 2800000, 'Industrial Zone', 'Logistics Solutions Inc', (SELECT id FROM users WHERE email = 'manager@peregrine.com'), ARRAY[(SELECT id FROM users WHERE email = 'employee@peregrine.com')]),
('Residential Complex', 'Construction of 50-unit residential apartment complex', 'on_hold', '2024-02-15', '2024-10-30', 4200000, 'Suburban Area', 'Home Builders LLC', (SELECT id FROM users WHERE email = 'supervisor@peregrine.com'), ARRAY[(SELECT id FROM users WHERE email = 'foreman@peregrine.com')]);

-- Insert sample incident reports
INSERT INTO incident_reports (title, description, severity, status, reportedBy, assignedTo, location, dateOccurred, category, actions) VALUES
('Fall from Scaffold', 'Worker slipped and fell from 10-foot scaffold while installing framing', 'high', 'investigating', (SELECT id FROM users WHERE email = 'employee@peregrine.com'), (SELECT id FROM users WHERE email = 'hse@peregrine.com'), 'Skyline Tower - Floor 5', '2024-02-10', 'Safety Accident', ARRAY['Immediate medical attention provided', 'Site safety meeting conducted', 'Scaffold inspection scheduled']),
('Equipment Malfunction', 'Excavator hydraulic system failed during foundation work', 'medium', 'resolved', (SELECT id FROM users WHERE email = 'foreman@peregrine.com'), (SELECT id FROM users WHERE email = 'manager@peregrine.com'), 'Highway Bridge - Site A', '2024-02-08', 'Equipment Failure', ARRAY['Equipment removed from service', 'Maintenance team called', 'Backup equipment deployed']),
('Material Shortage', 'Steel delivery delayed by 3 days affecting project timeline', 'low', 'open', (SELECT id FROM users WHERE email = 'manager@peregrine.com'), (SELECT id FROM users WHERE email = 'manager@peregrine.com'), 'Skyline Tower - Storage', '2024-02-12', 'Logistics', ARRAY['Contacted supplier', 'Rescheduled work activities', 'Updated project timeline']),
('Near Miss', 'Crane load nearly struck workers due to high winds', 'critical', 'investigating', (SELECT id FROM users WHERE email = 'engineer@peregrine.com'), (SELECT id FROM users WHERE email = 'hse@peregrine.com'), 'Industrial Complex - Building 3', '2024-02-09', 'Safety Incident', ARRAY['Work stopped immediately', 'All personnel evacuated', 'Weather assessment conducted', 'New safety procedures implemented']);

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
