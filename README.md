# Peregrine Construction Management Backend

Node.js + TypeScript backend for Peregrine Construction Management application with Supabase database integration.

## Features

- **Authentication**: JWT-based auth with role-based access control
- **User Management**: CRUD operations for users with roles (COO, Manager, Employee, HR, HSE)
- **Project Management**: Full project lifecycle management
- **Incident Reporting**: HSE incident tracking and management
- **Type Safety**: Full TypeScript support with Zod validation
- **Security**: Rate limiting, CORS, helmet, input validation

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting

## Setup

### Prerequisites

- Node.js 18+ installed
- Supabase project created

### Installation

1. Clone and install dependencies:
```bash
cd server-peregrine
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure your `.env` file:
```env
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

4. Set up Supabase database tables:
```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('COO', 'MANAGER', 'EMPLOYEE', 'HR', 'HSE')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'resigned')),
  department TEXT,
  position TEXT,
  hireDate DATE,
  profileImage TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold')),
  startDate DATE NOT NULL,
  endDate DATE,
  budget DECIMAL,
  location TEXT,
  client TEXT,
  managerId UUID REFERENCES users(id),
  teamMembers UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incident reports table
CREATE TABLE incident_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  reportedBy UUID REFERENCES users(id),
  assignedTo UUID REFERENCES users(id),
  location TEXT,
  dateOccurred DATE NOT NULL,
  category TEXT NOT NULL,
  actions TEXT[] DEFAULT '{}',
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Production

Build and start production server:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and role
- `POST /api/auth/register` - Register new user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Mark user as resigned

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Incidents
- `GET /api/incidents` - Get all incidents
- `GET /api/incidents/:id` - Get incident by ID
- `POST /api/incidents` - Create new incident
- `PUT /api/incidents/:id` - Update incident
- `POST /api/incidents/:id/actions` - Add action to incident

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... }
}
```

Or for errors:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Security Features

- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation with Zod
- Password hashing with bcrypt
- JWT token authentication

## License

MIT
