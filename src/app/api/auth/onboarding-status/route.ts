import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ 
        authenticated: false, 
        needsOnboarding: false 
      });
    }

    const user = await prisma.user.findUnique({ 
      where: { id: session.user.id },
      select: { 
        id: true,
        fullName: true, 
        name: true,
        phone: true, 
        address: true 
      }
    });
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false, 
        needsOnboarding: false 
      });
    }

    // User needs onboarding if name/phone/address is missing
    const needsOnboarding = !user.fullName && !user.name || !user.phone || !user.address;

    return NextResponse.json({ 
      authenticated: true, 
      needsOnboarding 
    });
    
  } catch (err: any) {
    console.error('onboarding-status error:', err?.message || err);
    return NextResponse.json({ 
      message: 'Internal Server Error' 
    }, { status: 500 });
  }
}
