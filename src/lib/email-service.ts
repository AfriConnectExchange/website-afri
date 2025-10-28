
'use server';

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
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(options: MailOptions, actorUserId?: string) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      ...options,
    });

    // Log success activity (actorUserId optional)
    if (actorUserId) {
      await logActivity({
        user_id: actorUserId,
        action: 'email_sent',
        entity_type: 'email',
        entity_id: options.to,
        changes: { subject: options.subject, to: options.to },
      });
    }

  } catch (error: any) {
    console.error('Email sending failed:', error);
    // Log failure activity
    if (actorUserId) {
      await logActivity({
        user_id: actorUserId,
        action: 'email_failure',
        entity_type: 'email',
        entity_id: options.to,
        changes: { error: error.message, subject: options.subject },
      });
    }

    throw new Error('Failed to send email.');
  }
}
