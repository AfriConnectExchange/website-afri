import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { logActivity } from '@/lib/activity-logger';
import crypto from 'crypto';

/**
 * Resend webhook receiver
 * - Stores incoming webhook payloads in a Firestore collection `email_events`
 * - Creates a lightweight activity log entry for visibility
 * - Optionally verifies HMAC signature if RESEND_WEBHOOK_SECRET is provided
 *
 * NOTE: Set RESEND_WEBHOOK_SECRET in your environment to enable signature verification.
 */
export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const sigHeader = req.headers.get('resend-signature') || req.headers.get('x-resend-signature') || '';

  const bodyText = await req.text();
  let payload: any = null;
  try {
    payload = JSON.parse(bodyText || '{}');
  } catch (err) {
    console.error('Invalid webhook JSON payload', err);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // If secret provided, attempt the HMAC verification. Resend docs may return
  // a signature in various formats; here we expect a hex HMAC of the body.
  if (secret) {
    try {
      const computed = crypto.createHmac('sha256', secret).update(bodyText).digest('hex');
      if (sigHeader && !sigHeader.includes(computed)) {
        console.warn('Webhook signature mismatch', { header: sigHeader, computed });
        // proceed but mark as unverified — you may choose to reject instead
      }
    } catch (e) {
      console.error('Error verifying webhook signature:', e);
    }
  }

  try {
    // Store raw event for later inspection
    await admin.firestore().collection('email_events').add({
      payload,
      received_at: new Date().toISOString(),
      signature: sigHeader || null,
    });

    // Create a short activity log entry so admins can see webhook activity in the UI
    try {
      const actor = payload?.recipient || 'system';
      const messageId = payload?.message_id || payload?.id || null;
      await logActivity({
        user_id: actor,
        action: 'email_webhook_event',
        entity_type: 'email',
        entity_id: messageId,
        changes: { event: payload, received_at: new Date().toISOString() },
      });
    } catch (actErr) {
      console.error('Failed to record webhook activity log:', actErr);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Failed to persist webhook event to Firestore:', error);
    return NextResponse.json({ error: 'Failed to persist event' }, { status: 500 });
  }
}
