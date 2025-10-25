import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { parseUserAgent, extractIpFromHeaders } from '../../../../lib/get-client-info';
import { getServerAuthSession } from '../../../../lib/get-server-session';

export async function POST(request: Request) {
  try {
  const resolved = await getServerAuthSession(request);
  if (!resolved?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const deviceId = body?.device_id || body?.deviceId;
    if (!deviceId) return NextResponse.json({ error: 'Missing device_id' }, { status: 400 });

    const ip = extractIpFromHeaders(request.headers);
    const ua = request.headers.get('user-agent') || '';
    const parsed = parseUserAgent(ua);

    const device = await prisma.deviceInfo.upsert({
      where: { deviceId },
      update: {
        userId: resolved.userId,
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
        userId: resolved.userId,
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

    // Also ensure there is a UserSession row linked to the active NextAuth session
    try {
      const sessionToken = resolved.sessionToken;
      if (sessionToken) {
        const nextAuthSession = await prisma.session.findUnique({ where: { sessionToken } });
        if (nextAuthSession) {
          await prisma.userSession.upsert({
            where: { sessionToken: nextAuthSession.sessionToken },
            update: {
              userId: resolved.userId,
              deviceId: device.deviceId,
              ipAddress: ip === 'unknown' ? null : ip,
              userAgent: ua,
              lastActivityAt: new Date(),
              isActive: true,
              expiresAt: nextAuthSession.expires,
            },
            create: {
              userId: resolved.userId,
              deviceId: device.deviceId,
              sessionToken: nextAuthSession.sessionToken,
              refreshToken: null,
              sessionTokenHash: null,
              refreshTokenHash: null,
              ipAddress: ip === 'unknown' ? null : ip,
              userAgent: ua,
              expiresAt: nextAuthSession.expires,
              lastActivityAt: new Date(),
              isActive: true,
            }
          });
        }
      }
    } catch (err) {
      console.error('Failed to upsert userSession for device registration:', err);
    }

    return NextResponse.json({ device });
  } catch (err: any) {
    console.error('Error in devices/register:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
