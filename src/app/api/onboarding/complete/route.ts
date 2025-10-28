
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { logActivity } from '@/lib/activity-logger';
import { sendEmail } from '@/lib/email-service';

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }
  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    const { fullName, phone, address, city, postcode, country, avatarUrl } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const userDocRef = admin.firestore().collection('users').doc(userId);
    const profileUpdateData = {
      full_name: fullName,
      phone,
      address,
      city,
      postcode,
      country,
      profile_picture_url: avatarUrl,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    // Use .set with { merge: true } to create or update fields
    await userDocRef.set(profileUpdateData, { merge: true });

    // Log the successful profile completion
    await logActivity({
      user_id: userId,
      action: 'onboarding_completed',
      entity_type: 'user',
      entity_id: userId,
      changes: profileUpdateData
    });
    
    // Create a welcome notification in-app
    await admin.firestore().collection('notifications').add({
        user_id: userId,
        type: 'system',
        title: 'Welcome to AfriConnect Exchange!',
        message: 'Your profile has been successfully set up. Start exploring the marketplace now!',
        read: false,
        created_at: new Date().toISOString()
    });

    // Send a welcome email if email is available
    if (userEmail) {
        await sendEmail({
            to: userEmail,
            subject: 'Welcome to AfriConnect Exchange!',
            text: `Hi ${fullName || 'there'},\n\nWelcome to AfriConnect Exchange! Your profile is now complete. We're excited to have you as part of our community.\n\nHappy exploring!\n\nThe AfriConnect Team`,
            html: `<p>Hi ${fullName || 'there'},</p><p>Welcome to AfriConnect Exchange! Your profile is now complete. We're excited to have you as part of our community.</p><p>Happy exploring!</p><p>The AfriConnect Team</p>`,
        }, userId);
    }
    
    return NextResponse.json({ success: true, message: 'Profile completed successfully.' });

  } catch (error: any) {
    console.error('Onboarding completion failed:', error);
    let message = 'Failed to complete onboarding.';
    if (error.code === 'auth/id-token-expired') {
        message = 'Your session has expired. Please sign in again.';
    }
    return NextResponse.json({ error: message, details: error.message }, { status: 500 });
  }
}
