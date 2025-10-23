import nodemailer from 'nodemailer';
import { logActivity } from './activity-logger';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER ?? process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail(options: MailOptions) {
  // Supabase removed — do not attempt to resolve a user. Use console/logActivity
  // fallback for persistence.
  const user: any = null;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      ...options,
    });
    
    // Log success activity (no user resolved)
    await logActivity({
      user_id: null,
      action: 'email_sent',
      entity_type: 'email',
      entity_id: options.to,
      changes: { subject: options.subject, to: options.to },
    });

  } catch (error: any) {
    console.error('Email sending failed:', error);
    // Log failure activity
    await logActivity({
      user_id: null,
      action: 'email_failure',
      entity_type: 'email',
      entity_id: options.to,
      changes: { error: error.message, subject: options.subject },
    });

    // Re-throw the error to be handled by the caller
    throw new Error('Failed to send email.');
  }
  // Persisting to Supabase removed — rely on logActivity or external logging
  // if persistence is required.
}
