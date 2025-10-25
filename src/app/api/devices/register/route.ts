import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';
import { parseUserAgent, extractIpFromHeaders } from '../../../../lib/get-client-info';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const deviceId = body?.device_id || body?.deviceId;
    if (!deviceId) return NextResponse.json({ error: 'Missing device_id' }, { status: 400 });

    const ip = extractIpFromHeaders(request.headers);
    const ua = request.headers.get('user-agent') || '';
    const parsed = parseUserAgent(ua);

    const device = await prisma.deviceInfo.upsert({
      where: { deviceId },
      update: {
        userId: session.user.id,
        browserName: parsed.browserName,
        browserVersion: parsed.browserVersion,
        osName: parsed.osName,
        osVersion: parsed.osVersion,
        deviceName: parsed.deviceModel || parsed.deviceVendor,
        deviceType: parsed.deviceType,
        ipAddress: ip === 'unknown' ? null : ip,
        userAgent: ua,
        lastSeenAt: new Date(),
        lastAuthenticatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        deviceId,
        browserName: parsed.browserName,
        browserVersion: parsed.browserVersion,
        osName: parsed.osName,
        osVersion: parsed.osVersion,
        deviceName: parsed.deviceModel || parsed.deviceVendor,
        deviceType: parsed.deviceType,
        ipAddress: ip === 'unknown' ? null : ip,
        userAgent: ua,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        lastAuthenticatedAt: new Date(),
      }
    });

    return NextResponse.json({ device });
  } catch (err: any) {
    console.error('Error in devices/register:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
