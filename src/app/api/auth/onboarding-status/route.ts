
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ authenticated: false, needsOnboarding: false }, { status: 200 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ authenticated: false, needsOnboarding: false }, { status: 200 });
    }

    // A user needs onboarding if their name, phone, or address is missing.
    const needsOnboarding = !user.name || !user.phone || !user.address;

    return NextResponse.json({ authenticated: true, needsOnboarding }, { status: 200 });
  } catch (err: any) {
    console.error('onboarding-status error:', err?.message || err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
