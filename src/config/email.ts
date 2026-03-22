import fetch from 'node-fetch';

interface MailsApiResponse {
  message?: string;
  [key: string]: any;
}

interface EmailValidationResponse {
  data: {
    result: 'deliverable' | 'undeliverable' | 'risky' | 'unknown';
    reason: string;
    score: number;
    is_disposable: boolean;
    is_free: boolean;
    [key: string]: any;
  };
  error: null | any;
  [key: string]: any;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

class EmailService {
  private apiKey: string;
  private apiUrl: string;
  private validationUrl: string;

  constructor() {
    this.apiKey = process.env.MAILS_API_KEY || '';
    this.apiUrl = 'https://api.mails.so/v1/batch';
    this.validationUrl = 'https://api.mails.so/v1/validate';
    if (!this.apiKey) {
      console.warn('⚠️ MAILS_API_KEY not set in .env');
    }
  }

  async validateEmail(email: string): Promise<EmailValidationResponse> {
    if (!this.apiKey) throw new Error('MAILS_API_KEY is missing');

    try {
      const response = await fetch(`${this.validationUrl}?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'x-mails-api-key': this.apiKey,
        },
      });

      const result = (await response.json()) as EmailValidationResponse;

      if (!response.ok) {
        throw new Error(result.error?.message || result.error || 'Failed to validate email via Mails.so');
      }

      console.log(`🔍 Email validation result for ${email}:`, result);
      return result;
    } catch (error: any) {
      console.error(`❌ Failed to validate email ${email}:`, error.message);
      throw error;
    }
  }

  isEmailValid(validation: EmailValidationResponse): boolean {
    return validation.data && 
           (validation.data.result === 'deliverable' || validation.data.result === 'risky') &&
           validation.data.score >= 50;
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

      const result = (await response.json()) as MailsApiResponse;

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