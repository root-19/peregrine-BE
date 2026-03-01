import express from 'express';
import { z } from 'zod';
import { db } from '../config/supabase';
import { ApiResponse, LeaveRequest } from '../types';

const router = express.Router();

console.log('📅 Leave requests routes loaded');

const createLeaveRequestSchema = z.object({
  userId: z.string(),
  type: z.enum(['Vacation', 'Sick', 'Emergency', 'Service Incentive']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string(),
});

const updateLeaveRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']).optional(),
  hrComment: z.string().optional(),
});

// Get all leave requests
router.get('/', async (req, res) => {
  try {
    console.log('📅 Fetching all leave requests...');
    const snapshot = await db.collection('leaveRequests').get();
    console.log(`📅 Found ${snapshot.docs.length} leave requests`);
    
    const leaveRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ success: true, data: leaveRequests } as ApiResponse<LeaveRequest[]>);
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({ success: false, error: 'Failed to get leave requests' } as ApiResponse);
  }
});

// Create leave request
router.post('/', async (req, res) => {
  try {
    const validatedData = createLeaveRequestSchema.parse(req.body);
    const now = new Date().toISOString();
    const leaveRequestData = {
      ...validatedData,
      status: 'pending',
      createdAt: now,
    };
    const docRef = await db.collection('leaveRequests').add(leaveRequestData);
    res.status(201).json({
      success: true,
      data: { id: docRef.id, ...leaveRequestData },
    } as ApiResponse<LeaveRequest>);
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({ success: false, error: 'Failed to create leave request' } as ApiResponse);
  }
});

// Update leave request (approve/reject)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateLeaveRequestSchema.parse(req.body);
    const leaveRequestRef = db.collection('leaveRequests').doc(id);
    const doc = await leaveRequestRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Leave request not found' } as ApiResponse);
    }
    
    const updateData = {
      ...validatedData,
      processedDate: validatedData.status ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };
    
    await leaveRequestRef.update(updateData);
    const updatedDoc = await leaveRequestRef.get();
    res.json({ success: true, data: { id: updatedDoc.id, ...updatedDoc.data() } } as ApiResponse<LeaveRequest>);
  } catch (error) {
    console.error('Update leave request error:', error);
    res.status(500).json({ success: false, error: 'Failed to update leave request' } as ApiResponse);
  }
});

// Delete leave request
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const leaveRequestRef = db.collection('leaveRequests').doc(id);
    const doc = await leaveRequestRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Leave request not found' } as ApiResponse);
    }
    await leaveRequestRef.delete();
    res.json({ success: true, message: 'Leave request deleted' } as ApiResponse);
  } catch (error) {
    console.error('Delete leave request error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete leave request' } as ApiResponse);
  }
});

export default router;
