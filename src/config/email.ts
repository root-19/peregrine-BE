import nodemailer from 'nodemailer';
import { Resend } from 'resend';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private resend: Resend | null = null;
  private transporter: nodemailer.Transporter | null = null;
  private useResend: boolean = false;

  constructor() {
    // Priority 1: Resend HTTP API (works on Railway/cloud)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      this.resend = new Resend(resendKey);
      this.useResend = true;
      console.log('🚀 Email service: Using Resend HTTP API');
    }

    // Priority 2: SMTP fallback (works locally)
    const smtpUser = process.env.MAIL_USERNAME;
    const smtpPass = process.env.MAIL_PASSWORD;
    if (smtpUser && smtpPass) {
      const port = parseInt(process.env.MAIL_PORT || '465');
      this.transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
      if (!this.useResend) {
        console.log('🚀 Email service: Using SMTP');
      } else {
        console.log('📧 SMTP available as fallback');
      }
    }

    if (!this.resend && !this.transporter) {
      console.error('❌ No email service configured! Set RESEND_API_KEY or MAIL_USERNAME/MAIL_PASSWORD');
    }
  }

  async sendEmail(options: SendEmailOptions) {
    const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    // Try Resend first (HTTP-based, works on Railway)
    if (this.resend) {
      try {
        const { data, error } = await this.resend.emails.send({
          from,
          to: [options.to],
          subject: options.subject,
          html: options.html,
        });

        if (error) {
          console.error('❌ Resend API Error:', error.message);
          // Fall through to SMTP
        } else {
          console.log(`✅ Email sent via Resend to: ${options.to} (ID: ${data?.id})`);
          return data;
        }
      } catch (err: any) {
        console.error('❌ Resend failed:', err.message);
        // Fall through to SMTP
      }
    }

    // Fallback to SMTP
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          text: options.text || options.html.replace(/<[^>]+>/g, ''),
          html: options.html,
        });
        console.log(`✅ Email sent via SMTP to: ${options.to} (ID: ${info.messageId})`);
        return info;
      } catch (err: any) {
        console.error('❌ SMTP failed:', err.message);
        throw err;
      }
    }

    throw new Error('No email service available');
  }

  async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const emailService = new EmailService();