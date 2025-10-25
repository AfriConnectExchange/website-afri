
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { extractIpFromHeaders } from '@/lib/get-client-info';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    const body = await req.json();
    const { eventType, description, isSuspicious } = body;

    if (!eventType) {
      return NextResponse.json({ message: 'Event type is required' }, { status: 400 });
    }

    const ip = extractIpFromHeaders(req.headers);
    const userAgent = req.headers.get('user-agent');

    await prisma.securityLog.create({
      data: {
        userId: userId,
        eventType,
        eventDescription: description,
        ipAddress: ip,
        userAgent: userAgent,
        isSuspicious: isSuspicious || false,
      },
    });

    return NextResponse.json({ message: 'Security event logged' }, { status: 200 });

  } catch (error) {
    console.error('Failed to log security event:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
