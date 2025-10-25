import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const deviceId = body?.device_id || body?.deviceId;
    if (!deviceId) return NextResponse.json({ error: 'Missing device_id' }, { status: 400 });

    const device = await prisma.deviceInfo.findUnique({ where: { deviceId } });
    if (!device || device.userId !== session.user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Mark device as not trusted and revoke related sessions
    await prisma.deviceInfo.update({ where: { deviceId }, data: { isTrusted: false } });

    // Revoke sessions that reference this deviceId in user_sessions
    await prisma.userSession.updateMany({ where: { deviceId }, data: { isActive: false, revokedAt: new Date() } });

    await prisma.activityLog.create({ data: { userId: session.user.id, sessionId: null, action: 'DEVICE_REVOKED', entityType: 'device', entityId: device.id } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error in revoke-session:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
