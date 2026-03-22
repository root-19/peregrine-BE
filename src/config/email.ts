import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false, // TLS
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async sendEmail(options: EmailOptions) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.MAIL_FROM_ADDRESS,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log("✅ Email sent:", info.messageId);
    } catch (error) {
      console.error("❌ Email failed:", error);
    }
  }

  async sendOTP(email: string, otp: string) {
    await this.sendEmail({
      to: email,
      subject: "Your OTP Code",
      html: `
        <h2>Your OTP Code</h2>
        <p>Use this code to login:</p>
        <h1>${otp}</h1>
        <p>This expires in 5 minutes.</p>
      `,
    });
  }
}

export const emailService = new EmailService();