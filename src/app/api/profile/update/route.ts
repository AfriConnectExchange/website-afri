// src/app/api/profile/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  try {
    //
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      fullName, 
      name,
      phone, 
      phoneNumber,
      address, 
      city, 
      country, 
      postcode 
    } = body || {};

    // ✅ Build update object dynamically
    const updateData: any = {};
    
    // Map different field names
    if (fullName || name) {
      updateData.fullName = fullName || name;
      updateData.name = fullName || name; // NextAuth uses "name"
    }
    if (phone || phoneNumber) {
      updateData.phone = phone || phoneNumber;
    }
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (country) updateData.country = country;
    if (postcode) updateData.postcode = postcode;

    // Check if user was previously needing onboarding
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true, address: true, email: true }
    });

    const neededBefore = !currentUser?.phone || !currentUser?.address;

    // ✅ Update user in database
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    const neededAfter = !updated.phone || !updated.address;

    // Send welcome email if onboarding is now complete
    if (neededBefore && !neededAfter) {
      try {
        const { enqueueEmail } = await import('@/lib/mailer');
        const { render } = await import('@react-email/render');
        const WelcomeEmail = (await import('@/emails/WelcomeEmail')).default;
        
        const html = await render(
          WelcomeEmail({ 
            name: updated.fullName ?? undefined, 
            actionUrl: process.env.NEXTAUTH_URL || 'https://app.africonnect.exchange' 
          })
        );
        
        await enqueueEmail({
          to: updated.email || '',
          subject: 'Welcome to AfriConnect Exchange',
          html,
          templateName: 'WelcomeEmail',
          userId: updated.id,
        });
      } catch (err: any) {
        console.error('Failed to send welcome email:', err?.message || err);
      }
    }

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: updated.id,
          action: 'PROFILE_UPDATED',
          entityType: 'user',
          entityId: updated.id,
        },
      });
    } catch (e) {
      console.error('Failed to create activity log:', e);
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.fullName,
        phone: updated.phone,
        address: updated.address,
      },
    });
    
  } catch (err: any) {
    console.error('Profile update error:', err);
    return NextResponse.json(
      { message: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}