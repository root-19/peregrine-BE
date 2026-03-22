import fetch from 'node-fetch';

interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

class EmailService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.MAILS_API_KEY || '';
    this.apiUrl = 'https://api.mails.so/v1/batch';
    if (!this.apiKey) {
      console.warn('⚠️ MAILS_API_KEY not set in .env');
    }
  }

  async sendEmail(options: SendEmailOptions) {
    if (!this.apiKey) throw new Error('MAILS_API_KEY is missing');

    const payload = {
      emails: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text || options.html?.replace(/<[^>]+>/g, ''),
      from: process.env.EMAIL_FROM || 'Peregrine Construction <noreply@peregrine.com>',
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mails-api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send email via Mails.so');
      }

      console.log(`✅ Email sent to ${options.to}`);
      return result;
    } catch (error: any) {
      console.error(`❌ Failed to send email to ${options.to}:`, error.message);
      throw error;
    }
  }
}

export const emailService = new EmailService();