import express from 'express';
import { z } from 'zod';
import { db } from '../config/supabase';
import { ApiResponse } from '../types';
import { authenticateToken, AuthRequest } from '../middleware/auth';

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

// Schema for status update validation — accepts both simple and canonical values
const updateStatusSchema = z.object({
  status: z.enum(['MR_SUBMITTED', 'PROCUREMENT_CHECKED', 'PM_VERIFIED', 'COO_APPROVED', 'PURCHASED', 'DELIVERED', 'REJECTED', 'submitted', 'checked', 'verified', 'purchased', 'rejected']),
  comment: z.string().optional()
});

// Normalize simple frontend status values to canonical DB values
function normalizeStatus(s: string): string {
  const map: Record<string, string> = {
    'submitted': 'MR_SUBMITTED',
    'checked': 'PROCUREMENT_CHECKED',
    'verified': 'PM_VERIFIED',
    'purchased': 'COO_APPROVED',
    'rejected': 'REJECTED',
  };
  return map[s] || s;
}

// Helper function to check if user can perform status transition
function canUpdateStatus(userRole: string, userPosition: string, currentStatus: string, newStatus: string): boolean {
  const isProcurement = userPosition?.toLowerCase().includes('procurement');
  const isSiteManager = userPosition?.toLowerCase().includes('site manager');
  const isManager = userRole === 'MANAGER';
  const isCOO = userRole === 'COO';

  // Normalize both statuses so old simple-value DB records work
  const normCurrent = normalizeStatus(currentStatus);
  const normNew = normalizeStatus(newStatus);

  // Site Manager employees can only submit (create) requests
  if (userRole === 'EMPLOYEE' && isSiteManager) {
    return false;
  }
  
  // Procurement employees can check submitted requests
  if (userRole === 'EMPLOYEE' && isProcurement && normCurrent === 'MR_SUBMITTED' && normNew === 'PROCUREMENT_CHECKED') {
    return true;
  }
  
  // Manager can verify checked requests
  if (isManager && normCurrent === 'PROCUREMENT_CHECKED' && normNew === 'PM_VERIFIED') {
    return true;
  }
  
  // COO can approve verified requests or reject at any stage
  if (isCOO) {
    if (normCurrent === 'PM_VERIFIED' && normNew === 'COO_APPROVED') {
      return true;
    }
    if (normNew === 'REJECTED') {
      return true;
    }
  }

  // Procurement and Manager can also reject
  if ((isProcurement || isManager) && normNew === 'REJECTED') {
    return true;
  }
  
  return false;
}

// Create a new material request
router.post('/requests', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('\n📦 CREATE MATERIAL REQUEST - Request received');
    console.log('📦 Request body:', req.body);
    console.log('📦 User:', req.user?.name, 'Role:', req.user?.role, 'Position:', req.user?.position);
    
    // Check if user is authorized to create material requests
    // Only Site Manager employees can create requests
    const isSiteManager = req.user?.position?.toLowerCase().includes('site manager');
    const isCOO = req.user?.role === 'COO';
    const isManager = req.user?.role === 'MANAGER';
    
    if (req.user?.role === 'EMPLOYEE' && !isSiteManager) {
      return res.status(403).json({
        success: false,
        message: 'Only Site Manager employees can create material requests'
      });
    }
    
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
router.get('/requests', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('\n📦 GET MATERIAL REQUESTS - Request received');
    console.log('📦 User:', req.user?.name, 'Role:', req.user?.role);
    
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
router.get('/requests/project/:projectId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    console.log('\n📦 GET PROJECT MATERIAL REQUESTS - Request received');
    console.log('📦 Project ID:', projectId);
    console.log('📦 User:', req.user?.name, 'Role:', req.user?.role);
    
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

router.put('/requests/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateStatusSchema.parse(req.body);
    const { comment } = validatedData;
    const status = normalizeStatus(validatedData.status);
    
    console.log('\n📦 UPDATE MATERIAL REQUEST STATUS - Request received');
    console.log('📦 Request ID:', id);
    console.log('📦 New Status:', status);
    console.log('📦 User:', req.user?.name, 'Role:', req.user?.role, 'Position:', req.user?.position);
    
    // Get current request
    const requestDoc = await db.collection('material_requests').doc(id as string).get();
    if (!requestDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Material request not found'
      });
    }
    
    const currentRequest = requestDoc.data();
    const currentStatus = currentRequest?.status;
    
    // Check if user can perform this status transition
    const canUpdate = canUpdateStatus(
      req.user?.role || '',
      req.user?.position || '',
      currentStatus,
      status
    );
    
    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to perform this status update',
        details: {
          userRole: req.user?.role,
          userPosition: req.user?.position,
          currentStatus,
          requestedStatus: status
        }
      });
    }
    
    // Add to history
    const historyEntry = {
      action: `Status changed from ${currentStatus} to ${status}`,
      actorId: req.user?.id,
      actorName: req.user?.name,
      actorRole: req.user?.role,
      timestamp: new Date().toISOString(),
      comment: comment || ''
    };
    
    // Update request
    await db
      .collection('material_requests')
      .doc(id as string)
      .update({ 
        status, 
        updatedAt: new Date().toISOString(),
        history: [...(currentRequest?.history || []), historyEntry]
      });
    
    res.json({
      success: true,
      message: `Material request ${status.replace('_', ' ').toLowerCase()} successfully`,
      historyEntry
    });
  } catch (error) {
    console.error('❌ Error updating material request:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update material request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
