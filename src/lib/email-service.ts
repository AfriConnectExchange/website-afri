
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

function getEnvEmailFrom(): string {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    // Provide a sensible default tied to the verified sending subdomain.
    // This avoids failing when the env var is missing and ensures we use the
    // correct domain: email.africonnect-exchange.org
    return 'AfriConnect <notifications@email.africonnect-exchange.org>';
  }

  return from;
}

export async function sendEmail(options: MailOptions, actorUserId?: string) {
  const from = getEnvEmailFrom();

  // Simple check: ensure the from address domain matches the verified domain pattern
  try {
    const fromMatch = from.match(/<([^>]+)>/);
    const emailAddr = fromMatch ? fromMatch[1] : from;
    if (typeof emailAddr === 'string' && !emailAddr.includes('@email.africonnect-exchange.org')) {
      console.warn('EMAIL_FROM does not use the recommended verified sending subdomain (email.africonnect-exchange.org). Consider using an address on that subdomain to maximize deliverability.');
    }
  } catch (e) {
    // ignore parse errors
  }

  try {
    const resp = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    // Always log success activity (use 'system' when actorUserId not provided)
    try {
      await logActivity({
        user_id: actorUserId ?? 'system',
        action: 'email_sent',
        entity_type: 'email',
        entity_id: options.to,
        changes: { subject: options.subject, to: options.to, resend_response: resp ?? null },
      });
    } catch (logErr) {
      // Logging should not block the response; just warn
      console.warn('Failed to write email_sent activity log:', logErr);
    }

    return resp;

  } catch (error: any) {
    console.error('Email sending failed via Resend:', error);
    // Always log failure activity (use 'system' when actorUserId not provided)
    try {
      await logActivity({
        user_id: actorUserId ?? 'system',
        action: 'email_failure',
        entity_type: 'email',
        entity_id: options.to,
        changes: { error: error?.message ?? String(error), subject: options.subject },
      });
    } catch (logErr) {
      console.warn('Failed to write email_failure activity log:', logErr);
    }

    // Rethrow original error so callers can handle it accordingly
    throw error;
  }
}
