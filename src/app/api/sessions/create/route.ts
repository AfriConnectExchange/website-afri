import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    const forwardedFor = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
    const userAgent = req.headers.get('user-agent') || (body.user_agent ?? null);
    const deviceId = body.device_id ?? null;

    const sessionsRef = admin.firestore().collection('user_sessions');

    // Create session document
    const sessionDoc = {
      user_id: uid,
      device_id: deviceId,
      user_agent: userAgent,
      ip_address: ip,
      is_active: true,
      created_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    } as any;

    const docRef = await sessionsRef.add(sessionDoc);

    // Check if device is new for this user
    if (deviceId) {
      const q = await admin.firestore().collection('user_sessions')
        .where('user_id', '==', uid)
        .where('device_id', '==', deviceId)
        .get();
      if (q.empty || q.size === 1) {
        // If there is only the new session (size===1) or none, treat as new device
        // Write a lightweight notification document
        await admin.firestore().collection('notifications').add({
          user_id: uid,
          type: 'system',
          title: 'New device signed in',
          message: `A new device signed in from ${userAgent ?? 'an unknown device'}. If this wasn't you, please secure your account.`,
          link_url: '/profile?tab=settings',
          read: false,
          priority: 'high',
          created_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ ok: true, session_id: docRef.id });
  } catch (err: any) {
    console.error('Failed to create session:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
