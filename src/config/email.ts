import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

// Resend HTTP API (works on Railway - bypasses SMTP blocking)
async function sendViaResend(options: { from: string; to: string; subject: string; html?: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: options.from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error: ${err}`);
  }
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false, // use STARTTLS on port 587
      family: 4, // Force IPv4 to avoid ENETUNREACH on IPv6
      auth: {
        user: process.env.MAIL_USERNAME || process.env.EMAIL_USER!,
        pass: process.env.MAIL_PASSWORD || process.env.EMAIL_PASS!,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false,
      },
    } as SMTPTransport.Options);
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const from = process.env.EMAIL_FROM || process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME!;

    // Try Resend HTTP API first (works on Railway)
    if (process.env.RESEND_API_KEY) {
      try {
        await sendViaResend({ from, to: options.to, subject: options.subject, html: options.html });
        console.log(`✅ Email sent via Resend to ${options.to}`);
        return;
      } catch (resendError: any) {
        console.error('Resend failed:', resendError.message);
      }
    }

    // Fallback to SMTP nodemailer
    try {
      await this.transporter.sendMail({ from, to: options.to, subject: options.subject, text: options.text, html: options.html });
      console.log(`✅ Email sent via SMTP to ${options.to}`);
    } catch (error) {
      console.error('Email sending failed:', error);
      console.warn('Email service unavailable - continuing without email notification');
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to Peregrine Construction Management',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a5632; color: white; padding: 20px; text-align: center;">
            <h1>🏗️ Peregrine Construction</h1>
            <p>Construction & Management L.L.C INC</p>
          </div>
          <div style="padding: 20px; background: #f9fafb;">
            <h2>Welcome, ${name}!</h2>
            <p>Your account has been successfully created in the Peregrine Construction Management System.</p>
            <p>You can now access the system and start managing projects, incidents, and team collaboration.</p>
            <div style="background: white; padding: 15px; border-left: 4px solid #1a5632; margin: 20px 0;">
              <h3>Next Steps:</h3>
              <ul>
                <li>Complete your profile information</li>
                <li>Join your assigned projects</li>
                <li>Familiarize yourself with the dashboard</li>
              </ul>
            </div>
            <p>For support, please contact your system administrator.</p>
          </div>
          <div style="background: #1a5632; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>&copy; 2024 Peregrine Construction & Management L.L.C INC</p>
          </div>
        </div>
      `,
    });
  }

  async sendIncidentNotification(email: string, incidentTitle: string, severity: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `🚨 New Incident Report: ${incidentTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1>⚠️ Incident Alert</h1>
            <p>Peregrine Construction Management</p>
          </div>
          <div style="padding: 20px; background: #fef2f2;">
            <h2>New Incident Reported</h2>
            <div style="background: white; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
              <h3>${incidentTitle}</h3>
              <p><strong>Severity:</strong> <span style="color: ${severity === 'critical' ? '#dc2626' : severity === 'high' ? '#ea580c' : '#ca8a04'}">${severity.toUpperCase()}</span></p>
              <p>Please review and take appropriate action.</p>
            </div>
            <p>Login to the system to view full details and respond to this incident.</p>
          </div>
          <div style="background: #1a5632; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>&copy; 2024 Peregrine Construction & Management L.L.C INC</p>
          </div>
        </div>
      `,
    });
  }

  async sendProjectAssignment(email: string, projectName: string, role: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `📋 Project Assignment: ${projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a5632; color: white; padding: 20px; text-align: center;">
            <h1>🏗️ Project Assignment</h1>
            <p>Peregrine Construction Management</p>
          </div>
          <div style="padding: 20px; background: #f0fdf4;">
            <h2>You've been assigned to a new project!</h2>
            <div style="background: white; padding: 15px; border-left: 4px solid #1a5632; margin: 20px 0;">
              <h3>${projectName}</h3>
              <p><strong>Your Role:</strong> ${role}</p>
              <p>You can now access project details, tasks, and collaborate with team members.</p>
            </div>
            <p>Login to the system to view project details and start collaborating.</p>
          </div>
          <div style="background: #1a5632; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>&copy; 2024 Peregrine Construction & Management L.L.C INC</p>
          </div>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
