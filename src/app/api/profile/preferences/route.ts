
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;
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
