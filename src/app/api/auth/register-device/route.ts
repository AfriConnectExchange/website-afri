import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Lightweight stub: log payload and return success so client doesn't 404 during dev.
    // Replace this with real device/session registration logic as needed.
    // eslint-disable-next-line no-console
    console.log('[api/auth/register-device] payload:', body);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[api/auth/register-device] error parsing body', err);
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}
