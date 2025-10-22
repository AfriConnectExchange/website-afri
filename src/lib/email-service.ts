
import nodemailer from 'nodemailer';
import { logActivity } from './activity-logger';
import { createServerClient } from './supabase/server';

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
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(options: MailOptions) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      ...options,
    });
    
    // Log success activity
    if(user?.id) {
        await logActivity({
          user_id: user.id, // Or a system user ID
          action: 'email_sent',
          entity_type: 'email',
          entity_id: options.to,
          changes: { subject: options.subject, to: options.to },
        });
    }

  } catch (error: any) {
    console.error('Email sending failed:', error);
    // Log failure activity
    if(user?.id) {
        await logActivity({
          user_id: user.id, // Or a system user ID
          action: 'email_failure',
          entity_type: 'email',
          entity_id: options.to,
          changes: { error: error.message, subject: options.subject },
        });
    }

    // Re-throw the error to be handled by the caller
    throw new Error('Failed to send email.');
  }
}
