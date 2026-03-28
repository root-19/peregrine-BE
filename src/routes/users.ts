import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../config/supabase';
import { ApiResponse, User } from '../types';

const router = express.Router();

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['COO', 'MANAGER', 'EMPLOYEE', 'HR', 'HSE']),
  position: z.string().min(2),
  department: z.string().optional().or(z.literal('')),
  phone: z.string().optional(),
  status: z.enum(['active', 'resigned']).default('active'),
  password: z.string().min(6),
  hireDate: z.string(),
  joinDate: z.string(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  profileimage: z.string().url().optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  profileimage: z.string().url().optional().nullable(),
  about: z.string().optional(),
  position: z.string().optional(),
});

// Helper to strip password from user data
function sanitizeUser(id: string, data: any) {
  const { password, ...rest } = data;
  return { id, ...rest };
}

router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all users from users collection...');
    const snapshot = await db.collection('users').get();
    console.log(`📋 Found ${snapshot.docs.length} users`);

    const users = snapshot.docs.map(doc => sanitizeUser(doc.id, doc.data()));

    res.json({
      success: true,
      data: users
    } as ApiResponse<User[]>);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

// POST /users - Create new user
router.post('/', async (req, res) => {
  try {
    console.log('👤 Creating new user...');
    console.log('👤 Raw request body:', req.body);
    
    const validatedData = createUserSchema.parse(req.body);
    console.log('👤 Validated user data:', { ...validatedData, password: '[REDACTED]' });

    // Check if user with this email already exists
    const existingUsers = await db
      .collection('users')
      .where('email', '==', validatedData.email)
      .get();
    
    if (!existingUsers.empty) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      } as ApiResponse);
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user with timestamps
    const now = new Date().toISOString();
    const userData = {
      ...validatedData,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await db.collection('users').add(userData);
    const newUser = sanitizeUser(docRef.id, { ...userData, id: docRef.id });

    console.log('✅ User created successfully:', newUser.name);

    res.status(201).json({
      success: true,
      data: newUser
    } as ApiResponse<User>);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    
    if (error instanceof z.ZodError) {
      console.error('❌ Validation errors:', error.issues);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('users').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: sanitizeUser(doc.id, doc.data())
    } as ApiResponse<User>);
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

// Dedicated profile update endpoint
router.put('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateProfileSchema.parse(req.body);

    console.log(`\n📝 PROFILE UPDATE for user ${id}:`, validatedData);

    const userRef = db.collection('users').doc(id);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
    }

    await userRef.update({
      ...validatedData,
      updated_at: new Date().toISOString()
    });

    const updatedDoc = await userRef.get();
    const user = sanitizeUser(updatedDoc.id, updatedDoc.data());

    console.log('✅ Profile updated successfully:', (user as any).name);

    res.json({
      success: true,
      data: user
    } as ApiResponse<User>);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);

    const userRef = db.collection('users').doc(id);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found or update failed'
      } as ApiResponse);
    }

    await userRef.update({
      ...validatedData,
      updated_at: new Date().toISOString()
    });

    const updatedDoc = await userRef.get();

    res.json({
      success: true,
      data: sanitizeUser(updatedDoc.id, updatedDoc.data())
    } as ApiResponse<User>);
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const userRef = db.collection('users').doc(id);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete user'
      } as ApiResponse);
    }

    await userRef.update({ status: 'resigned', updated_at: new Date().toISOString() });

    res.json({
      success: true,
      message: 'User marked as resigned'
    } as ApiResponse);
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

export default router;
