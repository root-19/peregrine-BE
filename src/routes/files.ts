import express from 'express';
import { z } from 'zod';
import { db } from '../config/supabase';
import { ApiResponse, ProjectFile } from '../types';

const router = express.Router();

console.log('📄 Files routes loaded');

const createFileSchema = z.object({
  folderId: z.string(),
  name: z.string().min(1),
  url: z.string().optional(),
  size: z.string().optional(),
  uploadedBy: z.string(),
});

// Get all files for a folder (or project root)
router.get('/folder/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;
    const snapshot = await db.collection('files').where('folderId', '==', folderId).get();
    const files = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: files } as ApiResponse<any[]>);
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ success: false, error: 'Failed to get files' } as ApiResponse);
  }
});

// Get all files for a project (all folders + root)
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    // Get folders for this project
    const foldersSnapshot = await db.collection('folders').where('projectId', '==', projectId).get();
    const folderIds = foldersSnapshot.docs.map(doc => doc.id);
    // Get files in project root + all folders
    const allFolderIds = [projectId, ...folderIds];
    const allFiles: any[] = [];
    for (const fId of allFolderIds) {
      const filesSnapshot = await db.collection('files').where('folderId', '==', fId).get();
      filesSnapshot.docs.forEach(doc => {
        allFiles.push({ id: doc.id, ...doc.data() });
      });
    }
    res.json({ success: true, data: allFiles } as ApiResponse<any[]>);
  } catch (error) {
    console.error('Get project files error:', error);
    res.status(500).json({ success: false, error: 'Failed to get project files' } as ApiResponse);
  }
});

// Create file
router.post('/', async (req, res) => {
  try {
    const validatedData = createFileSchema.parse(req.body);
    const now = new Date().toISOString();
    const fileData = {
      ...validatedData,
      size: validatedData.size || '0 MB',
      uploadDate: now.split('T')[0],
      createdAt: now,
    };
    const docRef = await db.collection('files').add(fileData);
    res.status(201).json({
      success: true,
      data: { id: docRef.id, ...fileData },
    } as ApiResponse<ProjectFile>);
  } catch (error) {
    console.error('Create file error:', error);
    res.status(500).json({ success: false, error: 'Failed to create file' } as ApiResponse);
  }
});

// Delete file
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fileRef = db.collection('files').doc(id);
    const doc = await fileRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'File not found' } as ApiResponse);
    }
    await fileRef.delete();
    res.json({ success: true, message: 'File deleted' } as ApiResponse);
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete file' } as ApiResponse);
  }
});

export default router;
