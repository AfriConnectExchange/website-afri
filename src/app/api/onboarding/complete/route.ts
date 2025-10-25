import { NextResponse } from "next/server";
import { getServerAuthSession } from '@/lib/get-server-session';
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession(request as any);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { fullName, phoneNumber, location, roles } = body || {};

    // Validate minimal payload
    if (!fullName && !phoneNumber && !location && !roles) {
      return NextResponse.json({ error: "Missing profile data" }, { status: 400 });
    }

    // Update the user via Prisma to ensure single source of truth
    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phone = phoneNumber;
    if (location) updateData.address = location;
    if (roles) updateData.roles = roles;
    updateData.status = 'active';

    await prisma.user.update({ where: { id: session.userId }, data: updateData });

    // Ensure onboarding progress is recorded
    await prisma.userOnboardingProgress.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, walkthroughCompleted: true, completedAt: new Date() },
      update: { walkthroughCompleted: true, completedAt: new Date() },
    });

    // Log onboarding completion
    try {
      await prisma.activityLog.create({ data: { userId: session.userId, action: 'ONBOARDING_COMPLETED', entityType: 'onboarding' } });
    } catch (e) {
      console.error('Failed to create activity log for onboarding completion:', e);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error in onboarding/complete:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
