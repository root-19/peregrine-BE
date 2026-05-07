import express from 'express';
import { z } from 'zod';
import { db } from '../config/supabase';
import { ApiResponse } from '../types';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Helper function to create notifications
async function createNotification(
  type: string,
  title: string,
  message: string,
  actorId: string,
  actorName: string,
  recipientRole?: string,
  recipientId?: string,
  relatedId?: string,
  relatedType?: string
) {
  try {
    const notificationData = {
      type,
      title,
      message,
      actorId,
      actorName,
      recipientRole,
      recipientId,
      relatedId,
      relatedType,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    if (recipientRole === 'ALL_USERS') {
      // Create notifications for all active users except the actor
      const usersSnapshot = await db.collection('users').where('status', '==', 'active').get();
      const activeUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const otherUsers = activeUsers.filter((user: any) => user.id !== actorId);

      const notificationPromises = otherUsers.map(async (user: any) => {
        const userNotification = {
          ...notificationData,
          recipientId: user.id,
          recipientRole: user.role,
        };
        
        const docRef = await db.collection('notifications').add(userNotification);
        return { id: docRef.id, ...userNotification };
      });
      
      await Promise.all(notificationPromises);
      console.log(`✅ Created ${otherUsers.length} notifications for ALL_USERS`);
    } else if (recipientRole === 'COO') {
      // Find COO user
      const cooSnapshot = await db.collection('users').where('role', '==', 'COO').where('status', '==', 'active').get();
      const cooUsers = cooSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (cooUsers.length > 0) {
        const coo = cooUsers[0];
        const cooNotification = {
          ...notificationData,
          recipientId: coo.id,
          recipientRole: coo.role,
        };
        
        await db.collection('notifications').add(cooNotification);
        console.log(`✅ Notification created for COO: ${coo.name}`);
      }
    } else if (recipientRole === 'PROCUREMENT') {
      // Find all procurement employees
      const procurementSnapshot = await db.collection('users')
        .where('role', '==', 'EMPLOYEE')
        .where('status', '==', 'active')
        .get();
      
      const procurementUsers = procurementSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((user: any) => user.position?.toLowerCase().includes('procurement'));

      const notificationPromises = procurementUsers.map(async (user: any) => {
        const userNotification = {
          ...notificationData,
          recipientId: user.id,
          recipientRole: user.role,
        };
        
        const docRef = await db.collection('notifications').add(userNotification);
        return { id: docRef.id, ...userNotification };
      });
      
      await Promise.all(notificationPromises);
      console.log(`✅ Created ${procurementUsers.length} notifications for PROCUREMENT team`);
    } else if (recipientRole === 'MANAGER') {
      // Find all project managers
      const managerSnapshot = await db.collection('users')
        .where('role', '==', 'MANAGER')
        .where('status', '==', 'active')
        .get();
      
      const managerUsers = managerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const notificationPromises = managerUsers.map(async (user: any) => {
        const userNotification = {
          ...notificationData,
          recipientId: user.id,
          recipientRole: user.role,
        };
        
        const docRef = await db.collection('notifications').add(userNotification);
        return { id: docRef.id, ...userNotification };
      });
      
      await Promise.all(notificationPromises);
      console.log(`✅ Created ${managerUsers.length} notifications for MANAGER team`);
    } else if (recipientId) {
      // Single user notification
      await db.collection('notifications').add(notificationData);
      console.log(`✅ Single notification created for ${recipientId}`);
    }
  } catch (error) {
    console.error('❌ Error creating notification:', error);
  }
}

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
    
    // Create notifications
    // 1. Notify Procurement team about new material request
    await createNotification(
      'MATERIAL_REQUEST_SUBMITTED',
      'New Material Request Submitted',
      `${req.user?.name} has requested ${validatedData.quantity} ${validatedData.unit} of ${validatedData.name} for project.`,
      req.user?.id || '',
      req.user?.name || '',
      'PROCUREMENT',
      undefined,
      docRef.id,
      'material_request'
    );
    
    // 2. Notify Site Manager (if different from requester) about their request submission
    if (req.user?.position?.toLowerCase().includes('site manager')) {
      await createNotification(
        'MATERIAL_REQUEST_SUBMITTED',
        'Material Request Submitted Successfully',
        `Your request for ${validatedData.quantity} ${validatedData.unit} of ${validatedData.name} has been submitted and is now under review.`,
        req.user?.id || '',
        req.user?.name || '',
        undefined,
        req.user?.id,
        docRef.id as string,
        'material_request'
      );
    }
    
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
    
    // Create notifications based on status change
    const materialName = currentRequest?.name || 'Material';
    const quantity = currentRequest?.quantity || '';
    const unit = currentRequest?.unit || '';
    const requesterId = currentRequest?.requestedBy;
    const requesterName = currentRequest?.requestedByName;
    
    if (status === 'PROCUREMENT_CHECKED') {
      // Notify Project Managers that a request is ready for verification
      await createNotification(
        'MATERIAL_REQUEST_CHECKED',
        'Material Request Ready for Verification',
        `${req.user?.name} has checked the material request for ${quantity} ${unit} of ${materialName}. Ready for PM verification.`,
        req.user?.id || '',
        req.user?.name || '',
        'MANAGER',
        undefined,
        id as string,
        'material_request'
      );
      
      // Notify original requester that their request has been checked
      if (requesterId) {
        await createNotification(
          'MATERIAL_REQUEST_CHECKED',
          'Material Request Checked',
          `Your request for ${quantity} ${unit} of ${materialName} has been checked by procurement and is now under PM review.`,
          req.user?.id || '',
          req.user?.name || '',
          undefined,
          requesterId,
          id as string,
          'material_request'
        );
      }
    } else if (status === 'PM_VERIFIED') {
      // Notify COO that a request is ready for approval
      await createNotification(
        'MATERIAL_REQUEST_VERIFIED',
        'Material Request Ready for Approval',
        `${req.user?.name} has verified the material request for ${quantity} ${unit} of ${materialName}. Ready for COO approval.`,
        req.user?.id || '',
        req.user?.name || '',
        'COO',
        undefined,
        id as string,
        'material_request'
      );
      
      // Notify original requester that their request has been verified
      if (requesterId) {
        await createNotification(
          'MATERIAL_REQUEST_VERIFIED',
          'Material Request Verified',
          `Your request for ${quantity} ${unit} of ${materialName} has been verified by the Project Manager and is now pending COO approval.`,
          req.user?.id || '',
          req.user?.name || '',
          undefined,
          requesterId,
          id as string,
          'material_request'
        );
      }
    } else if (status === 'COO_APPROVED') {
      // Notify Procurement team to proceed with purchase
      await createNotification(
        'MATERIAL_REQUEST_PURCHASED',
        'Material Request Approved - Ready for Purchase',
        `${req.user?.name} has approved the material request for ${quantity} ${unit} of ${materialName}. Please proceed with purchase.`,
        req.user?.id || '',
        req.user?.name || '',
        'PROCUREMENT',
        undefined,
        id as string,
        'material_request'
      );
      
      // Notify original requester that their request has been approved
      if (requesterId) {
        await createNotification(
          'MATERIAL_REQUEST_PURCHASED',
          'Material Request Approved',
          `Your request for ${quantity} ${unit} of ${materialName} has been approved by the COO! Procurement will proceed with the purchase.`,
          req.user?.id || '',
          req.user?.name || '',
          undefined,
          requesterId,
          id as string,
          'material_request'
        );
      }
    } else if (status === 'REJECTED') {
      // Notify all relevant parties about rejection
      const rejectionReason = comment || 'No reason provided';
      
      // Notify original requester
      if (requesterId) {
        await createNotification(
          'MATERIAL_REQUEST_REJECTED',
          'Material Request Rejected',
          `Your request for ${quantity} ${unit} of ${materialName} has been rejected. Reason: ${rejectionReason}`,
          req.user?.id || '',
          req.user?.name || '',
          undefined,
          requesterId,
          id as string,
          'material_request'
        );
      }
      
      // Notify Procurement team
      await createNotification(
        'MATERIAL_REQUEST_REJECTED',
        'Material Request Rejected',
        `The material request for ${quantity} ${unit} of ${materialName} has been rejected by ${req.user?.name}. Reason: ${rejectionReason}`,
        req.user?.id || '',
        req.user?.name || '',
        'PROCUREMENT',
        undefined,
        id as string,
        'material_request'
      );
      
      // Notify Project Managers
      await createNotification(
        'MATERIAL_REQUEST_REJECTED',
        'Material Request Rejected',
        `The material request for ${quantity} ${unit} of ${materialName} has been rejected by ${req.user?.name}. Reason: ${rejectionReason}`,
        req.user?.id || '',
        req.user?.name || '',
        'MANAGER',
        undefined,
        id as string,
        'material_request'
      );
    }
    
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
