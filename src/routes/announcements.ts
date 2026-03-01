import express from 'express';
import { z } from 'zod';
import { db } from '../config/supabase';
import { ApiResponse, Announcement } from '../types';

const router = express.Router();

console.log('📢 Announcements routes loaded');

const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  postedBy: z.string(),
});

// Get all announcements
router.get('/', async (req, res) => {
  try {
    console.log('📢 Fetching all announcements...');
    const snapshot = await db.collection('announcements').get();
    console.log(`📢 Found ${snapshot.docs.length} announcements`);
    
    const announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ success: true, data: announcements } as ApiResponse<Announcement[]>);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ success: false, error: 'Failed to get announcements' } as ApiResponse);
  }
});

// Create announcement
router.post('/', async (req, res) => {
  try {
    const validatedData = createAnnouncementSchema.parse(req.body);
    const now = new Date().toISOString();
    const announcementData = {
      ...validatedData,
      date: now.split('T')[0],
      createdAt: now,
    };
    const docRef = await db.collection('announcements').add(announcementData);
    res.status(201).json({
      success: true,
      data: { id: docRef.id, ...announcementData },
    } as ApiResponse<Announcement>);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ success: false, error: 'Failed to create announcement' } as ApiResponse);
  }
});

// Update announcement
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = createAnnouncementSchema.partial().parse(req.body);
    const announcementRef = db.collection('announcements').doc(id);
    const doc = await announcementRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Announcement not found' } as ApiResponse);
    }
    await announcementRef.update({ ...validatedData, updatedAt: new Date().toISOString() });
    const updatedDoc = await announcementRef.get();
    res.json({ success: true, data: { id: updatedDoc.id, ...updatedDoc.data() } } as ApiResponse<Announcement>);
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ success: false, error: 'Failed to update announcement' } as ApiResponse);
  }
});

// Delete announcement
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const announcementRef = db.collection('announcements').doc(id);
    const doc = await announcementRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Announcement not found' } as ApiResponse);
    }
    await announcementRef.delete();
    res.json({ success: true, message: 'Announcement deleted' } as ApiResponse);
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete announcement' } as ApiResponse);
  }
});

export default router;
