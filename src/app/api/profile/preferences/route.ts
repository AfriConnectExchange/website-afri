
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/get-server-session';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession(req as any);
    if (!session || !session.userId) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.userId;
    const body = await req.json();

    const { language, timezone, ...notificationPreferences } = body;

    await prisma.user.update({
      where: { id: userId },
      data: {
        language: language,
        timezone: timezone,
        notificationPreferences: notificationPreferences,
      },
    });

    return NextResponse.json({ message: 'Preferences saved' }, { status: 200 });

  } catch (error) {
    console.error('Failed to save preferences:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
