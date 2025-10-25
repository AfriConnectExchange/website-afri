import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.id) {
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

    await prisma.user.update({ where: { id: session.user.id }, data: updateData });

    // Ensure onboarding progress is recorded
    await prisma.userOnboardingProgress.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, walkthroughCompleted: true, completedAt: new Date() },
      update: { walkthroughCompleted: true, completedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error in onboarding/complete:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
