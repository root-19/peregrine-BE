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
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials or user not found'
      } as ApiResponse);
    }

    const userDoc = snapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    // For development: accept password123 for all users
    const isValidPassword = password === 'password123' || await bcrypt.compare(password, (user as any).password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials or user not found'
      } as ApiResponse);
    }

    // Generate OTP (6-digit number)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`\n🔐 LOGIN ATTEMPT DETECTED:`);
    console.log(`📧 Email: ${email}`);
    console.log(`👔 Role: ${role}`);
    console.log(`👤 User: ${(user as any).name}`);
    console.log(`🔑 OTP Code: ${otp}`);
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    console.log(`📱 Device: Mobile App`);

    // Validate email before sending notification (fire-and-forget)
    emailService.validateEmail(email).then(validation => {
      if (validation.valid) {
        // Send login notification email
        emailService.sendEmail({
          to: email,
          subject: `🔐 Login Verification - Peregrine Construction`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1a5632; color: white; padding: 20px; text-align: center;">
                <h1>🏗️ Peregrine Construction</h1>
                <p>Login Verification</p>
              </div>
              <div style="padding: 20px; background: #f0fdf4;">
                <h2>Hello ${(user as any).name},</h2>
                <p>A login attempt was made for your Peregrine Construction account.</p>
                <div style="background: white; padding: 15px; border-left: 4px solid #1a5632; margin: 20px 0;">
                  <h3>🔐 Login Details:</h3>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Role:</strong> ${role}</p>
                  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                  <p><strong>Device:</strong> Mobile App</p>
                  <p><strong>OTP Code:</strong> <span style="font-size: 24px; font-weight: bold; color: #1a5632;">${otp}</span></p>
                </div>
                <p>If this was you, please proceed with the login process.</p>
                <p>If you did not attempt this login, please secure your account immediately.</p>
              </div>
              <div style="background: #1a5632; color: white; padding: 15px; text-align: center; font-size: 12px;">
                <p>&copy; 2024 Peregrine Construction & Management L.L.C INC</p>
              </div>
            </div>
          `
        }).catch((emailError: any) => {
          console.error('❌ Failed to send login email:', emailError.message);
        });
      } else {
        console.warn(`⚠️ Email validation failed for ${email}:`, validation.reason);
      }
    }).catch((validationError: any) => {
      console.error('❌ Failed to validate email:', validationError.message);
    });

    const token = jwt.sign(
      { userId: user.id, email: (user as any).email, role: (user as any).role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.json({
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
        token,
        otp
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse);
  }
});

router.post('/resend-otp', async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ success: false, error: 'Email and role are required' } as ApiResponse);
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('email', '==', email)
      .where('role', '==', role)
      .where('status', '==', UserStatus.ACTIVE)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ success: false, error: 'User not found' } as ApiResponse);
    }

    const userDoc = snapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`\n🔄 OTP RESEND:`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 New OTP Code: ${otp}`);

    // Validate email before sending notification (fire-and-forget)
    emailService.validateEmail(email).then(validation => {
      if (validation.valid) {
        // Send email
        emailService.sendEmail({
          to: email,
          subject: `🔐 New Verification Code - Peregrine Construction`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1a5632; color: white; padding: 20px; text-align: center;">
                <h1>🏗️ Peregrine Construction</h1>
                <p>New Verification Code</p>
              </div>
              <div style="padding: 20px; background: #f0fdf4;">
                <h2>Hello ${(user as any).name},</h2>
                <p>Here is your new verification code:</p>
                <div style="background: white; padding: 15px; border-left: 4px solid #1a5632; margin: 20px 0; text-align: center;">
                  <p style="font-size: 32px; font-weight: bold; color: #1a5632; letter-spacing: 8px;">${otp}</p>
                </div>
                <p>This code will expire in 10 minutes.</p>
              </div>
              <div style="background: #1a5632; color: white; padding: 15px; text-align: center; font-size: 12px;">
                <p>&copy; 2024 Peregrine Construction & Management L.L.C INC</p>
              </div>
            </div>
          `
        }).catch((emailError: any) => {
          console.error('❌ Failed to send resend OTP email:', emailError.message);
        });
      } else {
        console.warn(`⚠️ Email validation failed for ${email}:`, validation.reason);
      }
    }).catch((validationError: any) => {
      console.error('❌ Failed to validate email:', validationError.message);
    });

    res.json({
      success: true,
      data: { otp }
    } as ApiResponse);
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
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
