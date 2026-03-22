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
    const port = parseInt(process.env.MAIL_PORT || '465');
    
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465, // SSL for 465, STARTTLS for 587
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      },
      // Short timeouts so it fails fast instead of hanging 3-5 min
      connectionTimeout: 10000,  // 10 seconds to connect
      greetingTimeout: 10000,    // 10 seconds for greeting
      socketTimeout: 15000,      // 15 seconds for socket
    });

    this.transporter.verify((error) => {
      if (error) {
        console.error('❌ SMTP Connection Error:', error.message);
        console.log('💡 Tip: If deployed on Railway/Render, SMTP ports may be blocked. Consider using an HTTP email API.');
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

  async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const emailService = new EmailService();