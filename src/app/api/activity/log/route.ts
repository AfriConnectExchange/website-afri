import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { logActivity } from '@/lib/activity-logger';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    // Try to authenticate with bearer token if provided
    const authHeader = req.headers.get('authorization') || '';
    let uid: string | null = null;
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        uid = decoded.uid;
      } catch (err) {
        // invalid token - fall through and allow anonymous logging
        console.warn('Invalid auth token for activity log:', err);
      }
    }

    const forwardedFor = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
    const userAgent = req.headers.get('user-agent') || (body.user_agent ?? null);

    const payload = {
      user_id: uid ?? (body.user_id ?? 'anonymous'),
      action: body.action ?? 'unknown',
      entity_type: body.entity_type ?? null,
      entity_id: body.entity_id ?? null,
      changes: body.changes ?? {},
      ip_address: ip,
      user_agent: userAgent,
    };

    await logActivity(payload as any);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Failed to write activity log:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
