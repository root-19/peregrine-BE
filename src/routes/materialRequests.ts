import express from 'express';
import { z } from 'zod';
import { db } from '../config/supabase';
import { ApiResponse } from '../types';

const router = express.Router();

// Schema for material request validation
const createMaterialRequestSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  name: z.string().min(1, 'Material name is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  unit: z.string().min(1, 'Unit is required'),
  urgency: z.enum(['low', 'normal', 'high']).default('normal'),
  notes: z.string().optional(),
  requestedBy: z.string().min(1, 'Requested by is required'),
  requestedByName: z.string().min(1, 'Requested by name is required'),
});

// Create a new material request
router.post('/requests', async (req, res) => {
  try {
    // Validate request body
    const validatedData = createMaterialRequestSchema.parse(req.body);
    
    // Create material request in Firestore
    const materialRequest = {
      ...validatedData,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const docRef = await db.collection('material_requests').add(materialRequest);
    const newMaterialRequest = { id: docRef.id, ...materialRequest };
    
    console.log('✅ Material request created:', docRef.id);
    
    res.status(201).json({
      success: true,
      message: 'Material request created successfully',
      data: newMaterialRequest
    });
  } catch (error) {
    console.error('❌ Error creating material request:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create material request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all material requests
router.get('/requests', async (req, res) => {
  try {
    const { projectId, status } = req.query;
    
    let snapshot;
    
    // Build query based on filters
    if (projectId && status) {
      snapshot = await db
        .collection('material_requests')
        .where('projectId', '==', projectId)
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .get();
    } else if (projectId) {
      snapshot = await db
        .collection('material_requests')
        .where('projectId', '==', projectId)
        .orderBy('createdAt', 'desc')
        .get();
    } else if (status) {
      snapshot = await db
        .collection('material_requests')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .get();
    } else {
      snapshot = await db
        .collection('material_requests')
        .orderBy('createdAt', 'desc')
        .get();
    }
    
    const materialRequests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: materialRequests
    });
  } catch (error) {
    console.error('❌ Error fetching material requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch material requests',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get material requests by project ID
router.get('/requests/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const snapshot = await db
      .collection('material_requests')
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const materialRequests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: materialRequests
    });
  } catch (error) {
    console.error('❌ Error fetching project material requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project material requests',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update material request status
router.put('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    await db
      .collection('material_requests')
      .doc(id)
      .update({ 
        status, 
        updatedAt: new Date().toISOString() 
      });
    
    res.json({
      success: true,
      message: 'Material request status updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating material request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update material request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
