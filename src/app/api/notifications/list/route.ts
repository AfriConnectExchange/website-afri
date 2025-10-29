
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import type { Notification } from '@/components/notifications/notification-item';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];

    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const notificationsQuery = await admin.firestore().collection('notifications')
        .where('user_id', '==', userId)
        .orderBy('created_at', 'desc')
        .limit(20)
        .get();

    const notifications = notificationsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().created_at, // Remap for frontend component
    }));

    return NextResponse.json(notifications);

  } catch (error: any) {
    console.error('Failed to fetch notifications:', error);
    if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Unauthorized: Token has expired' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

    