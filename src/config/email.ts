import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create the transporter using your Railway Variables
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT || '587'),
      secure: process.env.MAIL_PORT === '465', // true for 465, false for 587
      auth: {
        user: process.env.MAIL_USERNAME, 
        pass: process.env.MAIL_PASSWORD, // Your SMTP Password
      },
      // Helps bypass some certificate issues in cloud environments
      tls: {
        rejectUnauthorized: false 
      }
    });

    // Verify connection on startup
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ SMTP Connection Error:', error.message);
      } else {
        console.log('🚀 SMTP Server is ready to take our messages');
      }
    });
  }

  async sendEmail(options: SendEmailOptions) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Peregrine" <noreply@yourdomain.com>',
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]+>/g, ''),
      html: options.html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent via SMTP:', info.messageId);
      return info;
    } catch (error: any) {
      console.error('❌ SMTP Send Error:', error.message);
      throw error;
    }
  }

  // Simplified validation for SMTP logic
  async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const emailService = new EmailService();