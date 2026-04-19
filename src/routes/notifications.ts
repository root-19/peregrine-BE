import express from 'express';
import { db } from '../config/supabase';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all notifications for a user (by recipientId AND recipientRole)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const role = req.query.role as string;
    const limit = parseInt(req.query.limit as string) || 50;
    
    console.log(`📬 Fetching notifications for user: ${userId}, role: ${role || 'none'}, limit: ${limit}`);
    
    // Query 1: notifications directly targeted at this user by ID
    const byIdSnapshot = await db
      .collection('notifications')
      .where('recipientId', '==', userId)
      .get();
    
    const byIdNotifications = byIdSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`📋 Found ${byIdNotifications.length} notifications by recipientId`);
    
    // Query 2: notifications targeted at this user's role (if role provided)
    let byRoleNotifications: any[] = [];
    if (role) {
      const byRoleSnapshot = await db
        .collection('notifications')
        .where('recipientRole', '==', role)
        .get();
      byRoleNotifications = byRoleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`📋 Found ${byRoleNotifications.length} notifications by recipientRole: ${role}`);
    }
    
    // Query 3: notifications for ALL_USERS
    const allUsersSnapshot = await db
      .collection('notifications')
      .where('recipientRole', '==', 'ALL_USERS')
      .get();
    const allUsersNotifications = allUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`📋 Found ${allUsersNotifications.length} notifications for ALL_USERS`);
    
    // Merge and deduplicate by ID
    const allNotificationsMap = new Map<string, any>();
    [...byIdNotifications, ...byRoleNotifications, ...allUsersNotifications].forEach(n => {
      allNotificationsMap.set(n.id, n);
    });
    
    // Sort by createdAt descending, filter out USER_LOGIN notifications, and apply limit
    const notifications = Array.from(allNotificationsMap.values())
      .filter((notification: any) => notification.type !== 'USER_LOGIN')
      .sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
    
    console.log(`✅ Retrieved ${notifications.length} total notifications for user ${userId}`);
    
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
    
    // Filter out USER_LOGIN notifications from unread count
    const filteredNotifications = snapshot.docs.filter(doc => 
      doc.data().type !== 'USER_LOGIN'
    );
    
    res.json({
      success: true,
      data: { count: filteredNotifications.length }
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
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const notificationData = {
      ...req.body,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    
    console.log('🔔 Creating notification:', notificationData);
    
    // Handle ALL_USERS flag - create notifications for all active users
    if (notificationData.recipientRole === 'ALL_USERS') {
      console.log('📢 Creating notifications for ALL_USERS');
      
      // Get all active users
      const usersSnapshot = await db.collection('users').where('status', '==', 'active').get();
      const activeUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter out the user who created the notification
      const otherUsers = activeUsers.filter((user: any) => user.id !== notificationData.actorId);
      
      console.log(`📢 Creating ${otherUsers.length} notifications for active users`);
      
      // Create notification for each user
      const notificationPromises = otherUsers.map(async (user: any) => {
        const userNotification = {
          ...notificationData,
          recipientId: user.id,
          recipientRole: user.role,
        };
        
        const docRef = await db.collection('notifications').add(userNotification);
        console.log(`✅ Notification created for ${user.name} (${user.role})`);
        return { id: docRef.id, ...userNotification };
      });
      
      const notifications = await Promise.all(notificationPromises);
      
      res.status(201).json({
        success: true,
        message: `Created ${notifications.length} notifications for all active users`,
        data: notifications
      });
      
    } else if (notificationData.recipientRole === 'COO') {
      console.log('📢 Creating notification for COO');
      
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
        
        const docRef = await db.collection('notifications').add(cooNotification);
        console.log(`✅ Notification created for COO: ${coo.name}`);
        
        res.status(201).json({
          success: true,
          message: 'Notification created for COO',
          data: { id: docRef.id, ...cooNotification }
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'No active COO found'
        });
      }
      
    } else {
      // Create single notification for specific user
      const docRef = await db.collection('notifications').add(notificationData);
      console.log(`✅ Single notification created for ${notificationData.recipientId}`);
      
      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: { id: docRef.id, ...notificationData }
      });
    }
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
