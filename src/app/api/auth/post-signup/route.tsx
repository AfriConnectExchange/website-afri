import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { logActivity } from '@/lib/activity-logger';

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
    const userName = decodedToken.name || 'there';

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Read user doc to see if onboarding already completed or welcome email already sent
    try {
      const userDocRef = admin.firestore().collection('users').doc(userId);
      const userDoc = await userDocRef.get();
      const userData = userDoc.exists ? userDoc.data() : {};
      const alreadyWelcomed = !!(userData && (userData.welcome_email_sent === true || userData.onboarding_completed === true));
      if (alreadyWelcomed) {
        // Audit log: post-signup detected onboarding already completed or welcome previously sent
        try {
          await logActivity({
            user_id: userId,
            action: 'post_signup_welcome_skipped',
            entity_type: 'user',
            entity_id: userId,
            changes: { onboarding_completed: !!userData.onboarding_completed, welcome_email_sent: !!userData.welcome_email_sent }
          });
        } catch (lae) {
          console.warn('Failed to write audit log for skipped welcome in post-signup:', lae);
        }
      }
    } catch (docErr) {
      console.warn('Failed to read user doc in post-signup for welcome-skipped check:', docErr);
      // continue without blocking post-signup actions
    }

    // 2. Create Welcome Notification
    await admin.firestore().collection('notifications').add({
      user_id: userId,
      type: 'system',
      title: 'Welcome to AfriConnect Exchange!',
      message: 'Thanks for joining! Please verify your email to complete your profile.',
      read: false,
      created_at: new Date().toISOString(),
      priority: 'high',
    });
    
    // 3. Log the sign-up activity
    await logActivity({
        user_id: userId,
        action: 'user_signup',
        entity_type: 'user',
        entity_id: userId,
    });

    return NextResponse.json({ success: true, message: 'Post-signup actions completed.' });

  } catch (error: any) {
    console.error('Post-signup actions failed:', error);
    let message = 'Failed to complete post-signup actions.';
    if (error.code === 'auth/id-token-expired') {
        message = 'Your session has expired. Please sign in again.';
    }
    return NextResponse.json({ error: message, details: error.message }, { status: 500 });
  }
}
