
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
  const supabase = await createServerClient();
    const supabaseAdmin = await import('@/lib/supabase/serverAdminClient').then(m => m.createServerAdminClient());
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
  // Persist an email log using the schema columns in supabase/migrations/db.sql
  try {
    await (supabaseAdmin as any).from('email_logs').insert({
      recipient_email: options.to,
      sender_email: process.env.EMAIL_FROM,
      subject: options.subject,
      template_name: (options as any).templateName || null,
      provider: process.env.EMAIL_PROVIDER || 'smtp',
      provider_message_id: null,
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: (options as any).metadata || {},
    });
  } catch (logErr) {
    // If logging fails we don't want to break the main flow; record to console and continue
    console.error('Failed to persist email log:', logErr);
  }
}
