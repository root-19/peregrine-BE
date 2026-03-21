import express from 'express';
import { db } from '../config/supabase';

const router = express.Router();

// Get all notifications for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const snapshot = await db
      .collection('notifications')
      .where('recipientId', '==', userId)
      .limit(100)
      .get();
    
    const notifications = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get unread count for a user
router.get('/user/:userId/unread-count', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const snapshot = await db
      .collection('notifications')
      .where('recipientId', '==', userId)
      .where('isRead', '==', false)
      .get();
    
    res.json({
      success: true,
      data: { count: snapshot.docs.length }
    });
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new notification
router.post('/', async (req, res) => {
  try {
    const notification = {
      ...req.body,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await db.collection('notifications').add(notification);
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: { id: docRef.id, ...notification }
    });
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db
      .collection('notifications')
      .doc(id)
      .update({ isRead: true });
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mark all notifications as read for a user
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const snapshot = await db
      .collection('notifications')
      .where('recipientId', '==', userId)
      .where('isRead', '==', false)
      .get();
    
    // Update all notifications individually
    const updatePromises = snapshot.docs.map(doc => 
      db.collection('notifications').doc(doc.id).update({ isRead: true })
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: `Marked ${snapshot.docs.length} notifications as read`
    });
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.collection('notifications').doc(id).delete();
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
