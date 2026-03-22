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
    [key: string]: any;
  };
  error: null | any;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
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
      console.error('❌ CRITICAL: MAILS_API_KEY is missing from environment variables!');
    }
  }

  async validateEmail(email: string): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.validationUrl}?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: { 'x-mails-api-key': this.apiKey },
      });

      const result = (await response.json()) as EmailValidationResponse;
      
      // Return true if deliverable/risky and score is decent
      return (
        result.data?.result === 'deliverable' || 
        (result.data?.result === 'risky' && result.data?.score >= 50)
      );
    } catch (error: any) {
      console.error(`🔍 Validation Error (${email}):`, error.message);
      return true; // Fallback to true so we don't block users if validation API is down
    }
  }

  async sendEmail(options: SendEmailOptions) {
    if (!this.apiKey) throw new Error('MAILS_API_KEY is not configured');

    const payload = {
      // Mails.so batch expects an array of recipients
      emails: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]+>/g, ''),
      // IMPORTANT: This domain MUST be verified in your Mails.so dashboard
      from: process.env.EMAIL_FROM || 'Peregrine <noreply@peregrine.com>',
    };

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
      // This will show you exactly WHY the email didn't send in Railway logs
      console.error('❌ Mails.so API Rejected Request:', JSON.stringify(result, null, 2));
      throw new Error(result.message || `API Error: ${response.status}`);
    }

    console.log(`✅ Email accepted by API for: ${options.to}`);
    return result;
  }
}

export const emailService = new EmailService();