import express from 'express';
import { z } from 'zod';
import { db } from '../config/supabase';
import { ApiResponse, Project } from '../types';
import { authenticateToken, restrictEmployeeActions, restrictProjectCreation, AuthRequest } from '../middleware/auth';

const router = express.Router();

console.log('📋 Projects routes loaded');

const createProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  budget: z.number().positive().optional(),
  location: z.string().optional(),
  client: z.string().optional(),
  managerId: z.string(),
  teamMembers: z.array(z.string()).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(['planning', 'in_progress', 'completed', 'on_hold']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().positive().optional(),
  location: z.string().optional(),
  client: z.string().optional(),
  managerId: z.string().optional(),
  teamMembers: z.array(z.string()).optional(),
});

router.post('/', authenticateToken, restrictProjectCreation, async (req: AuthRequest, res) => {
  console.log('\n📝 CREATE PROJECT - Request received');
  console.log('📝 Request body:', req.body);

  try {
    const validatedData = createProjectSchema.parse(req.body);

    const projectResult = await db.collection('projects').add({
      name: validatedData.name,
      description: validatedData.description || '',
      status: 'planning',
      startDate: validatedData.startDate,
      endDate: validatedData.endDate || null,
      budget: validatedData.budget || null,
      location: validatedData.location || '',
      client: validatedData.client || '',
      managerId: validatedData.managerId,
      teamMembers: validatedData.teamMembers || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const project = { id: projectResult.id, ...projectResult.data() };

    console.log('✅ PROJECT CREATED:', project);

    res.status(201).json({
      success: true,
      data: project
    } as ApiResponse<Project>);
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('\n📋 GET PROJECTS - Request received');
    console.log('📋 User:', req.user?.name, 'Role:', req.user?.role);
    
    let query = db.collection('projects').orderBy('created_at', 'desc');
    
    // If user is EMPLOYEE, only show projects where they are team members
    if (req.user?.role === 'EMPLOYEE') {
      console.log('📋 EMPLOYEE user detected - filtering assigned projects');
      const snapshot = await query.get();
      const allProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log('📋 Total projects in DB:', allProjects.length);
      
      // Filter projects where employee is assigned as team member
      const assignedProjects = allProjects.filter(project => 
        project.teamMembers && project.teamMembers.includes(req.user!.id)
      );
      
      console.log('📋 Assigned projects for employee:', assignedProjects.length);
      
      res.json({
        success: true,
        data: assignedProjects
      } as ApiResponse<Project[]>);
    } else {
      console.log('📋 Non-EMPLOYEE user - showing all projects');
      // For other roles, show all projects
      const snapshot = await query.get();
      const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log('📋 Total projects returned:', projects.length);
      console.log('📋 Projects:', projects.map(p => ({ id: p.id, name: p.name })));
      
      res.json({
        success: true,
        data: projects
      } as ApiResponse<Project[]>);
    }
  } catch (error) {
    console.error('Projects fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('projects').doc(id as string).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }

    const project = { id: doc.id, ...doc.data() };
    
    // If user is EMPLOYEE, check if they are assigned to this project
    if (req.user?.role === 'EMPLOYEE') {
      if (!project.teamMembers || !project.teamMembers.includes(req.user!.id)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You are not assigned to this project'
        } as ApiResponse);
      }
    }

    res.json({
      success: true,
      data: project
    } as ApiResponse<Project>);
  } catch (error) {
    console.error('Project fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

router.put('/:id', authenticateToken, restrictEmployeeActions, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateProjectSchema.parse(req.body);

    const projectRef = db.collection('projects').doc(id as string);
    const doc = await projectRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or update failed'
      } as ApiResponse);
    }

    await projectRef.update({
      ...validatedData,
      updated_at: new Date().toISOString()
    });

    const updatedDoc = await projectRef.get();

    res.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() }
    } as ApiResponse<Project>);
  } catch (error) {
    console.error('Project update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

router.delete('/:id', authenticateToken, restrictEmployeeActions, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection('projects').doc(id as string).get();
    if (!doc.exists) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete project'
      } as ApiResponse);
    }

    await db.collection('projects').doc(id as string).delete();

    res.json({
      success: true,
      data: { message: 'Project deleted successfully' }
    } as ApiResponse);
  } catch (error) {
    console.error('Project deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

// Add team members to project
router.post('/:id/team-members', authenticateToken, restrictEmployeeActions, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { teamMembers } = req.body;

    if (!Array.isArray(teamMembers)) {
      return res.status(400).json({
        success: false,
        error: 'teamMembers must be an array'
      } as ApiResponse);
    }

    const projectRef = db.collection('projects').doc(id as string);
    const doc = await projectRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }

    const currentProject = doc.data();
    const updatedTeamMembers = [...new Set([...(currentProject.teamMembers || []), ...teamMembers])];

    await projectRef.update({
      teamMembers: updatedTeamMembers,
      updated_at: new Date().toISOString()
    });

    const updatedDoc = await projectRef.get();

    res.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() }
    } as ApiResponse<Project>);
  } catch (error) {
    console.error('Add team members error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add team members'
    } as ApiResponse);
  }
});

export default router;
