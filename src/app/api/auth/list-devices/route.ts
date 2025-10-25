import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/get-server-session';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: Request) {
  try {
  const session = await getServerAuthSession(request as any);
  if (!session?.userId) return NextResponse.json({ devices: [] });

    const devices = await prisma.deviceInfo.findMany({
  where: { userId: session.userId },
      orderBy: { lastSeenAt: 'desc' },
    });

    // Map to client-friendly shape
    const out = devices.map(d => ({
      id: d.id,
      device_id: d.deviceId,
      device_name: d.deviceName,
      browser_name: d.browserName,
      os_name: d.osName,
      last_seen_at: d.lastSeenAt,
    }));

    return NextResponse.json({ devices: out });
  } catch (err: any) {
    console.error('Error in list-devices:', err);
    return NextResponse.json({ devices: [] });
  }
}
