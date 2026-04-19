-- Create employees table (extended user management)
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL, -- Employee ID number (e.g., EMP-001)
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Link to users table
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  
  -- Contact Information
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Philippines',
  
  -- Employment Details
  employee_type TEXT CHECK (employee_type IN ('regular', 'contractual', 'project-based', 'intern')),
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('COO', 'MANAGER', 'EMPLOYEE', 'HR', 'HSE')),
  
  -- Employment Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'resigned', 'terminated')),
  hire_date DATE NOT NULL,
  regularization_date DATE,
  end_date DATE, -- For contractual/contract-based employees
  
  -- Compensation
  salary DECIMAL(12,2),
  hourly_rate DECIMAL(10,2),
  allowance DECIMAL(10,2),
  
  -- Work Schedule
  work_schedule TEXT DEFAULT 'regular', -- regular, night_shift, flexible
  work_days TEXT, -- Monday-Friday, etc.
  work_hours TEXT DEFAULT '8:00-17:00',
  
  -- Government Requirements
  sss_number TEXT,
  philhealth_number TEXT,
  pagibig_number TEXT,
  tin_number TEXT,
  
  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  
  -- Documents
  resume_url TEXT,
  contract_url TEXT,
  requirements_completed BOOLEAN DEFAULT false,
  
  -- System Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_position ON employees(position);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hire_date);
CREATE INDEX IF NOT EXISTS idx_employees_employee_type ON employees(employee_type);

-- Enable Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Employees can view own profile" ON employees FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Managers can view employees in their department" ON employees FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('MANAGER', 'COO', 'HR')
  )
);
CREATE POLICY "HR can view all employees" ON employees FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('HR', 'COO')
  )
);

CREATE POLICY "Employees can update own profile" ON employees FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "HR can update all employees" ON employees FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('HR', 'COO')
  )
);

CREATE POLICY "HR can insert employees" ON employees FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('HR', 'COO')
  )
);

CREATE POLICY "HR can delete employees" ON employees FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('HR', 'COO')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_employees_updated_at 
BEFORE UPDATE ON employees 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Create employee number generation function
CREATE OR REPLACE FUNCTION generate_employee_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  prefix TEXT := 'EMP';
  year_part TEXT := to_char(EXTRACT(YEAR FROM CURRENT_DATE), 'YY');
  sequence_num TEXT;
BEGIN
  -- Get the next sequence number for this year
  SELECT LPAD((COUNT(*) + 1)::TEXT, 3, '0') 
  INTO sequence_num 
  FROM employees 
  WHERE employee_id LIKE prefix || year_part || '%';
  
  new_id := prefix || year_part || sequence_num;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-create employee record when user is created
CREATE OR REPLACE FUNCTION create_employee_record()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO employees (
    employee_id,
    user_id,
    first_name,
    last_name,
    email,
    department,
    position,
    role,
    hire_date,
    employee_type,
    status,
    created_by
  ) VALUES (
    generate_employee_id(),
    NEW.id,
    SPLIT_PART(NEW.name, ' ', 1),
    COALESCE(SPLIT_PART(NEW.name, ' ', 2), NEW.name),
    NEW.email,
    COALESCE(NEW.department, 'General'),
    COALESCE(NEW.position, 'Staff'),
    NEW.role,
    COALESCE(NEW.hireDate, CURRENT_DATE),
    'regular',
    'active',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create employee record
CREATE TRIGGER create_employee_on_user_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_employee_record();

-- Comments for documentation
COMMENT ON TABLE employees IS 'Extended employee information linked to users table';
COMMENT ON COLUMN employees.employee_id IS 'Unique employee identification number';
COMMENT ON COLUMN employees.user_id IS 'Foreign key reference to users table';
COMMENT ON COLUMN employees.first_name IS 'Employee first name';
COMMENT ON COLUMN employees.last_name IS 'Employee last name';
COMMENT ON COLUMN employees.full_name IS 'Computed full name';
COMMENT ON COLUMN employees.employee_type IS 'Type of employment: regular, contractual, project-based, intern';
COMMENT ON COLUMN employees.status IS 'Current employment status';
COMMENT ON COLUMN employees.salary IS 'Monthly salary for regular employees';
COMMENT ON COLUMN employees.hourly_rate IS 'Hourly rate for contractual employees';
COMMENT ON COLUMN employees.requirements_completed IS 'Whether all required documents are submitted';
