import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/get-server-session';
import { getServerSession as nextGetServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { parseUserAgent, extractIpFromHeaders } from '@/lib/get-client-info';
import { v5 as uuidv5 } from 'uuid';

// A UUID namespace for generating deterministic device IDs
const DEVICE_ID_NAMESPACE = 'a3a6b57d-1f6e-4b47-8f5a-2e4b6e8a4c18';

export async function POST(req: NextRequest) {
  try {
    // First try NextAuth's getServerSession with the incoming request so it can
    // resolve cookies that were sent with this fetch. If that fails, fall back
    // to our robust helper which tries several strategies (including cookie
    // parsing + DB lookup).
    let resolved = null as any;
    try {
      const sess = await nextGetServerSession(req as any, undefined as any, authOptions as any);
      if (sess && (sess as any).user && (sess as any).user.id) {
        // attempt to find NextAuth session row in DB by user and expiry
        const dbSession = await prisma.session.findFirst({ where: { userId: (sess as any).user.id }, orderBy: { expires: 'desc' } });
        resolved = {
          userId: (sess as any).user.id,
          sessionId: dbSession?.id ?? null,
          sessionToken: dbSession?.sessionToken ?? null,
          expires: dbSession?.expires ?? null,
        } as any;
      }
    } catch (err) {
      // ignore and allow fallback
    }

    if (!resolved) {
      // Use our robust helper which can read cookies from the provided request
      resolved = await getServerAuthSession(req as Request);
    }

    if (!resolved || !resolved.userId) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userId = resolved.userId;
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const ip = extractIpFromHeaders(req.headers);
    const { browserName, osName, deviceVendor, deviceModel, deviceType } = parseUserAgent(userAgent);

    // Generate a deterministic device ID based on the user ID and user agent
    const deviceId = uuidv5(userAgent + (ip.split('.').slice(0,2).join('.')), DEVICE_ID_NAMESPACE);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
          loginCount: {
            increment: 1,
          },
        },
      });

      const nextAuthSession = await tx.session.findUnique({
        where: { id: resolved.sessionId ?? undefined },
      }) || await tx.session.findFirst({ where: { userId: userId }, orderBy: { expires: 'desc' } });

      if (nextAuthSession) {
        await tx.userSession.create({
          data: {
            userId: userId,
            ipAddress: ip,
            userAgent: userAgent,
            browser: browserName,
            os: osName,
            deviceType: deviceType,
            deviceName: deviceModel,
            sessionToken: nextAuthSession.sessionToken,
            expiresAt: nextAuthSession.expires,
          },
        });
      }

      await tx.activityLog.create({
        data: {
          userId: userId,
          sessionId: nextAuthSession?.id ?? resolved.sessionId ?? null,
          action: 'user-signed-in',
          ipAddress: ip,
          userAgent: userAgent,
        },
      });

      // Upsert device information
      await tx.deviceInfo.upsert({
        where: { deviceId: deviceId },
        create: {
          deviceId: deviceId,
          userId: userId,
          deviceType: deviceType,
          deviceName: deviceModel,
          platform: osName,
          osName: osName,
          osVersion: '',
          browserName: browserName,
          browserVersion: '',
          ipAddress: ip,
          userAgent: userAgent,
          lastSeenAt: new Date(),
          firstSeenAt: new Date(),
          lastAuthenticatedAt: new Date(),
        },
        update: {
          lastSeenAt: new Date(),
          lastAuthenticatedAt: new Date(),
          ipAddress: ip,
        },
      });
    });

    return NextResponse.json({ message: 'Session started and logged successfully' }, { status: 200 });

  } catch (error) {
    console.error('Failed to start and log session:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
