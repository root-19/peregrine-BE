import express from 'express';
import { db } from '../config/supabase';
import { ApiResponse } from '../types';

const router = express.Router();

// Get activity logs for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const snapshot = await db.collection('activityLogs')
      .where('projectId', '==', projectId)
      .limit(100)
      .get();
    const logs = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, data: logs } as ApiResponse<any[]>);
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to get activity logs' } as ApiResponse);
  }
});

// Create activity log
router.post('/', async (req, res) => {
  try {
    const { projectId, action, target, by, icon, color } = req.body;
    if (!projectId || !action || !target || !by) {
      return res.status(400).json({ success: false, error: 'Missing required fields' } as ApiResponse);
    }
    const now = new Date().toISOString();
    const logData = { projectId, action, target, by, icon: icon || 'time-outline', color: color || '#1a5632', createdAt: now };
    const docRef = await db.collection('activityLogs').add(logData);
    res.status(201).json({ success: true, data: { id: docRef.id, ...logData } } as ApiResponse);
  } catch (error) {
    console.error('Create activity log error:', error);
    res.status(500).json({ success: false, error: 'Failed to create activity log' } as ApiResponse);
  }
});

export default router;
