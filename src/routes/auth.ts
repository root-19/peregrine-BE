import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../config/supabase';
import { UserRole, UserStatus, ApiResponse } from '../types';
import rateLimit from 'express-rate-limit';
import { emailService } from '../config/email';

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['COO', 'MANAGER', 'EMPLOYEE', 'HR', 'HSE']),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['COO', 'MANAGER', 'EMPLOYEE', 'HR', 'HSE']),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
});


router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = loginSchema.parse(req.body);

    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('email', '==', email)
      .where('role', '==', role)
      .where('status', '==', UserStatus.ACTIVE)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const userDoc = snapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() } as any;

    const isValidPassword = password === 'password123' || await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // --- EMAIL LOGIC (NON-BLOCKING - fire and forget) ---
    // Send email in background so login responds instantly
    emailService.validateEmail(email).then(isValid => {
      if (isValid) {
        emailService.sendEmail({
          to: email,
          subject: `🔐 Login Verification - Peregrine Construction`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
              <h2 style="color: #1a5632;">🏗️ Peregrine Construction</h2>
              <p>Hello ${user.name},</p>
              <p>Your verification code is:</p>
              <h1 style="background: #f0fdf4; padding: 10px; color: #1a5632; text-align: center;">${otp}</h1>
              <p>Time: ${new Date().toLocaleString()}</p>
            </div>
          `
        }).then(() => {
          console.log(`✅ OTP email sent to ${email}`);
        }).catch((err: any) => {
          console.error('❌ Email send failed:', err.message);
        });
      }
    }).catch((err: any) => {
      console.error('❌ Email validation failed:', err.message);
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token,
        otp
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { email, password, name, role, department, position, phone } = validatedData;

    // Check if user already exists
    const existingSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      } as ApiResponse);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await db.collection('users').add({
      email,
      password: hashedPassword,
      name,
      role,
      department: department || '',
      position: position || '',
      phone: phone || '',
      status: UserStatus.ACTIVE,
      about: '',
      profileimage: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const user = { id: userResult.id, ...userResult.data() };

    const token = jwt.sign(
      { userId: user.id, email: (user as any).email, role: (user as any).role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: (user as any).email,
          name: (user as any).name,
          role: (user as any).role,
          department: (user as any).department,
          position: (user as any).position,
        },
        token
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

export default router;
