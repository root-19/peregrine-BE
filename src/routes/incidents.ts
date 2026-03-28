import express from 'express';
import { z } from 'zod';
import { db } from '../config/supabase';
import { ApiResponse, IncidentReport } from '../types';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const createIncidentSchema = z.object({
  type: z.enum(['NEAR_MISS', 'ACCIDENT', 'SECURITY']),
  description: z.string().min(2),
  location: z.string().min(2),
  date: z.string(),
  reportedBy: z.string(),
  status: z.enum(['open', 'investigating', 'resolved', 'closed']).default('open'),
});

const updateIncidentSchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().min(10).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
  location: z.string().optional(),
  dateOccurred: z.string().optional(),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
  actions: z.array(z.string()).optional(),
});

router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('incident_reports')
      .orderBy('created_at', 'desc')
      .get();

    const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({
      success: true,
      data: incidents
    } as ApiResponse<IncidentReport[]>);
  } catch (error) {
    console.error('Incidents fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const incidentId = Array.isArray(id) ? id[0] : id;
    const doc = await db.collection('incident_reports').doc(incidentId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: { id: doc.id, ...doc.data() }
    } as ApiResponse<IncidentReport>);
  } catch (error) {
    console.error('Incident fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

router.post('/', async (req, res) => {
  try {
    const validatedData = createIncidentSchema.parse(req.body);
    const { type, description, location, date, reportedBy, status } = validatedData;

    console.log('📋 Creating incident:', validatedData);

    const incidentResult = await db.collection('incident_reports').add({
      type,
      description,
      location,
      date,
      reportedBy,
      status,
      actions: [],
      attachments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      data: { id: incidentResult.id, ...incidentResult.data() }
    } as ApiResponse<IncidentReport>);
  } catch (error) {
    console.error('Incident creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateIncidentSchema.parse(req.body);

    const incidentId = Array.isArray(id) ? id[0] : id;
    const incidentRef = db.collection('incident_reports').doc(incidentId);
    const doc = await incidentRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found or update failed'
      } as ApiResponse);
    }

    await incidentRef.update({
      ...validatedData,
      updated_at: new Date().toISOString()
    });

    const updatedDoc = await incidentRef.get();

    res.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() }
    } as ApiResponse<IncidentReport>);
  } catch (error) {
    console.error('Incident update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

router.post('/:id/actions', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!action || typeof action !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Action text is required'
      } as ApiResponse);
    }

    const incidentRef = db.collection('incident_reports').doc(id);
    const doc = await incidentRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      } as ApiResponse);
    }

    const currentData = doc.data();
    const currentActions = currentData?.actions || [];
    await incidentRef.update({
      actions: [...currentActions, action],
      updated_at: new Date().toISOString()
    });

    const updatedDoc = await incidentRef.get();

    res.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() }
    } as ApiResponse<IncidentReport>);
  } catch (error) {
    console.error('Action addition error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

export default router;
