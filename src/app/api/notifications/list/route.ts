
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import type { Notification } from '@/components/notifications/notification-item';

// Mock data for notifications, as we don't have real ones yet.
const MOCK_NOTIFICATIONS: Omit<Notification, 'id'>[] = [
    {
      type: 'order',
      title: 'Order Confirmed',
      message: 'Your order #AC-12345 for Handwoven Cotton Throw Blanket has been confirmed.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      link_url: '/orders/AC-12345',
      priority: 'medium',
    },
    {
      type: 'delivery',
      title: 'Out for Delivery',
      message: 'Your package for order #AC-12344 is out for delivery and will arrive today.',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      read: false,
      link_url: '/tracking?orderId=AC-12344',
      priority: 'high',
    },
    {
      type: 'promotion',
      title: 'Weekend Flash Sale!',
      message: 'Get 20% off all items in the Home & Textiles category. This weekend only!',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      link_url: '/marketplace?category=textiles',
      priority: 'low',
    },
    {
      type: 'barter',
      title: 'New Barter Proposal',
      message: 'You have a new barter proposal from John D. for your Vintage Leather Bag.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      link_url: '/barter',
      priority: 'medium',
    },
    {
      type: 'system',
      title: 'Password Updated',
      message: 'Your password was successfully updated on a new device.',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      link_url: '/profile?tab=settings',
      priority: 'high',
    },
];


export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split('Bearer ')[1];

  try {
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
    
    // For demo purposes, if the user has no notifications, return mock data.
    if (notifications.length === 0) {
        const mockWithIds = MOCK_NOTIFICATIONS.map((n, i) => ({ ...n, id: `mock-${i}` }));
        return NextResponse.json(mockWithIds);
    }

    return NextResponse.json(notifications);

  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
