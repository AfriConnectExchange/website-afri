
'use server';

import { Resend } from 'resend';
import { logActivity } from './activity-logger';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(options: MailOptions, actorUserId?: string) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'AfriConnect <notifications@africonnectexchange.org>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
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
    console.error('Email sending failed via Resend:', error);
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
