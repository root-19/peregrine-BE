import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiResponse } from '../types';
import { db } from '../config/supabase';
import { uploadToLocal } from '../config/firebase';

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST /api/upload/profile - Upload profile image
router.post('/profile', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      } as ApiResponse);
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required'
      } as ApiResponse);
    }

    console.log('📸 Uploading profile image for user:', userId);
    console.log('📸 File info:', {
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    });

    // Upload to local storage and get public URL
    const imageUrl = uploadToLocal(file, userId);

    console.log('✅ Image uploaded to local storage:', imageUrl);

    // Save the image URL to the user's profile in the database
    try {
      await db.collection('users').doc(userId).update({
        avatar: imageUrl,
        updated_at: new Date().toISOString()
      });
      
      console.log('✅ Profile image URL saved to database for user:', userId);
    } catch (dbError) {
      console.error('❌ Failed to save avatar to database:', dbError);
      // Continue anyway - the upload worked but database update failed
    }

    console.log('✅ Profile image uploaded successfully');

    res.json({
      success: true,
      data: {
        url: imageUrl,
        fileName: file.filename
      }
    } as ApiResponse);

  } catch (error) {
    console.error('❌ Profile image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload profile image'
    } as ApiResponse);
  }
});

export default router;
