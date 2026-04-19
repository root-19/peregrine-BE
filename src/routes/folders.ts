import express from 'express';
import { z } from 'zod';
import { db } from '../config/supabase';
import { ApiResponse, ProjectFolder } from '../types';

const router = express.Router();

console.log('📁 Folders routes loaded');

const createFolderSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().optional(),
  assignedUserIds: z.array(z.string()).optional(),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  assignedUserIds: z.array(z.string()).optional(),
});

// Get all folders for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const snapshot = await db.collection('folders').where('projectId', '==', projectId).get();
    const folders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: folders } as ApiResponse<any[]>);
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ success: false, error: 'Failed to get folders' } as ApiResponse);
  }
});

// Create folder
router.post('/', async (req, res) => {
  try {
    const validatedData = createFolderSchema.parse(req.body);
    const now = new Date().toISOString();
    const folderData = {
      ...validatedData,
      assignedUserIds: validatedData.assignedUserIds || [],
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await db.collection('folders').add(folderData);
    res.status(201).json({
      success: true,
      data: { id: docRef.id, ...folderData },
    } as ApiResponse<ProjectFolder>);
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ success: false, error: 'Failed to create folder' } as ApiResponse);
  }
});

// Update folder
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateFolderSchema.parse(req.body);
    const folderRef = db.collection('folders').doc(id);
    const doc = await folderRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Folder not found' } as ApiResponse);
    }
    await folderRef.update({ ...validatedData, updatedAt: new Date().toISOString() });
    const updatedDoc = await folderRef.get();
    res.json({ success: true, data: { id: updatedDoc.id, ...updatedDoc.data() } } as ApiResponse<ProjectFolder>);
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ success: false, error: 'Failed to update folder' } as ApiResponse);
  }
});

// Delete folder
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const folderRef = db.collection('folders').doc(id);
    const doc = await folderRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Folder not found' } as ApiResponse);
    }
    // Delete all files in this folder
    const filesSnapshot = await db.collection('files').where('folderId', '==', id).get();
    for (const fileDoc of filesSnapshot.docs) {
      await db.collection('files').doc(fileDoc.id).delete();
    }
    // Delete child folders recursively
    const childFolders = await db.collection('folders').where('parentId', '==', id).get();
    for (const childDoc of childFolders.docs) {
      // Delete files in child folder
      const childFiles = await db.collection('files').where('folderId', '==', childDoc.id).get();
      for (const cf of childFiles.docs) {
        await db.collection('files').doc(cf.id).delete();
      }
      await db.collection('folders').doc(childDoc.id).delete();
    }
    await folderRef.delete();
    res.json({ success: true, message: 'Folder deleted' } as ApiResponse);
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete folder' } as ApiResponse);
  }
});

// Assign/remove user from folder
router.post('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, action } = req.body; // action: 'add' | 'remove'
    const folderRef = db.collection('folders').doc(id);
    const doc = await folderRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Folder not found' } as ApiResponse);
    }
    const current = doc.data();
    let assignedUserIds = current.assignedUserIds || [];
    if (action === 'add' && !assignedUserIds.includes(userId)) {
      assignedUserIds = [...assignedUserIds, userId];
    } else if (action === 'remove') {
      assignedUserIds = assignedUserIds.filter((uid: string) => uid !== userId);
    }
    await folderRef.update({ assignedUserIds, updatedAt: new Date().toISOString() });
    const updatedDoc = await folderRef.get();
    res.json({ success: true, data: { id: updatedDoc.id, ...updatedDoc.data() } } as ApiResponse<ProjectFolder>);
  } catch (error) {
    console.error('Assign folder user error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign user' } as ApiResponse);
  }
});

export default router;
