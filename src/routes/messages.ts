import express from 'express';
import { z } from 'zod';
import { db } from '../config/supabase';
import { ApiResponse, Message, Conversation } from '../types';

const router = express.Router();

console.log('💬 Messages routes loaded');

const createMessageSchema = z.object({
  conversationId: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  receiverId: z.string(),
  receiverName: z.string(),
  text: z.string(),
});

const createConversationSchema = z.object({
  participantIds: z.array(z.string()),
  participantNames: z.array(z.string()),
});

// Get all conversations for a user
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`💬 Fetching conversations for user: ${userId}`);
    console.log(`💬 DB instance:`, !!db);
    console.log(`💬 DB collection method:`, typeof db.collection);
    
    if (!db) {
      console.error('💬 DB is not initialized');
      return res.status(500).json({ success: false, error: 'Database not initialized' } as ApiResponse);
    }
    
    // Get all conversations and filter in memory (temporary fix for index issue)
    const allSnapshot = await db
      .collection('conversations')
      .orderBy('updatedAt', 'desc')
      .get();
    
    const conversations = allSnapshot.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .filter((conv: any) => conv.participantIds && conv.participantIds.includes(userId));
    
    console.log(`💬 Found ${conversations.length} conversations`);
    
    res.json({ success: true, data: conversations } as ApiResponse<Conversation[]>);
  } catch (error) {
    console.error('Get conversations error:', error);
    console.error('Get conversations error stack:', (error as Error).stack);
    res.status(500).json({ success: false, error: 'Failed to get conversations', details: (error as Error).message } as ApiResponse);
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    console.log(`💬 Fetching messages for conversation: ${conversationId}`);
    
    const snapshot = await db
      .collection('messages')
      .where('conversationId', '==', conversationId)
      .get();
    
    const messages = snapshot.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    console.log(`💬 Found ${messages.length} messages`);
    
    res.json({ success: true, data: messages } as ApiResponse<Message[]>);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to get messages' } as ApiResponse);
  }
});

// Create or get conversation
router.post('/conversations', async (req, res) => {
  try {
    const validatedData = createConversationSchema.parse(req.body);
    const now = new Date().toISOString();
    
    // Check if conversation already exists between these participants
    const existingSnapshot = await db
      .collection('conversations')
      .where('participantIds', '==', validatedData.participantIds.sort())
      .get();
    
    if (!existingSnapshot.empty) {
      const existingConversation = { id: existingSnapshot.docs[0].id, ...existingSnapshot.docs[0].data() };
      return res.json({ success: true, data: existingConversation } as ApiResponse<Conversation>);
    }
    
    // Create new conversation
    const conversationData = {
      ...validatedData,
      participantIds: validatedData.participantIds.sort(),
      unreadCounts: {},
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await db.collection('conversations').add(conversationData);
    const newConversation = { id: docRef.id, ...conversationData };
    
    res.status(201).json({ success: true, data: newConversation } as ApiResponse<Conversation>);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create conversation' } as ApiResponse);
  }
});

// Send message
router.post('/messages', async (req, res) => {
  try {
    console.log('💬 Send message request received');
    console.log('💬 Request body:', req.body);
    console.log('💬 Request headers:', req.headers);
    
    const validatedData = createMessageSchema.parse(req.body);
    console.log('💬 Validated data:', validatedData);
    
    const now = new Date().toISOString();
    
    const messageData = {
      ...validatedData,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      createdAt: now,
    };
    
    console.log('💬 Message data to save:', messageData);
    
    // Create message
    const messageRef = await db.collection('messages').add(messageData);
    const newMessage = { id: messageRef.id, ...messageData };
    
    console.log('💬 Message saved with ID:', messageRef.id);
    
    // Update conversation with last message info
    const conversationRef = db.collection('conversations').doc(validatedData.conversationId);
    const convDoc = await conversationRef.get();
    const existingConv = convDoc.exists ? convDoc.data() : {};
    const existingUnread = existingConv?.unreadCounts || {};
    const newUnreadCounts = { ...existingUnread, [validatedData.receiverId]: (existingUnread[validatedData.receiverId] || 0) + 1 };
    await conversationRef.update({
      lastMessage: validatedData.text,
      lastMessageTime: messageData.timestamp,
      updatedAt: now,
      unreadCounts: newUnreadCounts,
    });
    
    console.log(`💬 Message sent from ${validatedData.senderName} to ${validatedData.receiverName}`);
    console.log('💬 Conversation updated');
    
    res.status(201).json({ success: true, data: newMessage } as ApiResponse<Message>);
  } catch (error) {
    console.error('Send message error:', error);
    console.error('Send message error stack:', (error as Error).stack);
    console.error('Send message error details:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ success: false, error: 'Failed to send message', details: error instanceof Error ? error.message : 'Unknown error' } as ApiResponse);
  }
});

// Mark messages as read
router.put('/messages/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
    
    // Mark all messages in conversation as read for this user
    const allMessagesSnapshot = await db
      .collection('messages')
      .where('conversationId', '==', conversationId)
      .get();
    
    const messagesSnapshot = { docs: allMessagesSnapshot.docs.filter((doc: any) => {
      const data = doc.data();
      return data.receiverId === userId && data.isRead === false;
    })};
    
    // Update each message individually
    const updatePromises = messagesSnapshot.docs.map(doc => 
      db.collection('messages').doc(doc.id).update({ isRead: true })
    );
    
    await Promise.all(updatePromises);
    
    // Reset unread count for this user in conversation
    const convRef = db.collection('conversations').doc(conversationId);
    const convDoc = await convRef.get();
    const existingConv = convDoc.exists ? convDoc.data() : {};
    const existingUnread = existingConv?.unreadCounts || {};
    const resetUnread = { ...existingUnread, [userId]: 0 };
    await convRef.update({ unreadCounts: resetUnread });
    
    console.log(`💬 Marked ${messagesSnapshot.docs.length} messages as read for user ${userId}`);
    
    res.json({ success: true, message: 'Messages marked as read' } as ApiResponse);
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark messages as read' } as ApiResponse);
  }
});

export default router;
