
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
    const { step, isCompleted } = body;

    if (!step) {
      return NextResponse.json({ message: 'Step information is required' }, { status: 400 });
    }

    // Use upsert to create a record if it doesn't exist, or update it if it does.
    const progress = await prisma.userOnboardingProgress.upsert({
      where: { userId },
      create: {
        userId,
        completedSteps: [step],
        completedAt: isCompleted ? new Date() : null,
      },
      update: {
        // Use Prisma's JSON functions to merge arrays without duplicates
        completedSteps: {
          push: step
        },
        completedAt: isCompleted ? new Date() : null,
      },
    });

    return NextResponse.json({ message: 'Progress saved', progress }, { status: 200 });

  } catch (error) {
    console.error('Failed to save onboarding progress:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
