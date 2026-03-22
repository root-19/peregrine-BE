import fetch from "node-fetch";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private apiKey: string | null;
  private from: string | null;
  private isEnabled: boolean;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || null;
    this.from = process.env.EMAIL_FROM || null;
    this.isEnabled = !!(this.apiKey && this.from);
    
    if (!this.isEnabled) {
      console.log(" Email service disabled - RESEND_API_KEY or EMAIL_FROM not set");
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.isEnabled) {
      console.log(" Email service is disabled");
      return;
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.from,
          to: options.to,
          subject: options.subject,
          html: options.html,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Resend Error:", data);
        throw new Error("Failed to send email");
      }

      console.log("✅ Email sent:", data);
    } catch (error: any) {
      console.error("❌ Email failed:", error.message);
      throw error;
    }
  }

  // ✅ OTP EMAIL (ANTI-SPAM FORMAT)
  async sendOTP(email: string, otp: string) {
    if (!this.isEnabled) {
      console.log(" Email service disabled - OTP not sent");
      return;
    }
    
    await this.sendEmail({
      to: email,
      subject: "🔐 Your OTP Code",
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto;">
          <h2>Email Verification</h2>
        </div>
      `,
    });
  }

  // ✅ WELCOME EMAIL
  async sendWelcome(email: string, name: string) {
    if (!this.isEnabled) {
      console.log(" Email service disabled - Welcome email not sent");
      return;
    }
    
    await this.sendEmail({
      to: email,
      subject: "Welcome to Peregrine!",
      html: `
        <h2>Welcome, ${name} 👋</h2>
        <p>Your account has been created successfully.</p>
      `,
    });
  }
}

export const emailService = new EmailService();