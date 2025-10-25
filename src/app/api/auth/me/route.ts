import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/get-server-session';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request as any);
    if (!session?.userId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        address: true,
        roles: true,
        emailVerified: true,
      },
    });

    if (!user) return NextResponse.json({ user: null }, { status: 200 });

    const onboardingComplete = !!(user.fullName && user.phone && user.address);

    return NextResponse.json({ user: {
      id: user.id,
      email: user.email,
      name: user.fullName,
      phone: user.phone,
      address: user.address,
      roles: user.roles,
      emailVerified: !!user.emailVerified,
      onboardingComplete,
    } });
  } catch (err) {
    console.error('Error in /api/auth/me:', err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
