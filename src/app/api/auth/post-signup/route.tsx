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
