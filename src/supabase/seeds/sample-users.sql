-- Insert sample users with hashed passwords
-- Password for all users: "password123"

INSERT INTO users (email, password, name, role, status, department, position, hireDate, phone) VALUES
('wasieacuna@gmail.com', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'John Smith', 'COO', 'active', 'Executive', 'Chief Operating Officer', '2020-01-15', '+1234567890'),
('manager@peregrine.com', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'Sarah Johnson', 'MANAGER', 'active', 'Operations', 'Project Manager', '2021-03-20', '+1234567891'),
('employee@peregrine.com', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'Mike Wilson', 'EMPLOYEE', 'active', 'Construction', 'Site Supervisor', '2022-06-10', '+1234567892'),
('hr@peregrine.com', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'Emily Davis', 'HR', 'active', 'Human Resources', 'HR Manager', '2020-05-12', '+1234567893'),
('hse@peregrine.com', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'Robert Brown', 'HSE', 'active', 'Safety', 'HSE Officer', '2021-08-25', '+1234567894'),
('foreman@peregrine.com', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'James Garcia', 'EMPLOYEE', 'active', 'Construction', 'Foreman', '2022-02-14', '+1234567895'),
('engineer@peregrine.com', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'Lisa Martinez', 'EMPLOYEE', 'active', 'Engineering', 'Site Engineer', '2021-11-30', '+1234567896'),
('supervisor@peregrine.com', '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'David Lee', 'MANAGER', 'active', 'Operations', 'Site Supervisor', '2020-09-18', '+1234567897');

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
