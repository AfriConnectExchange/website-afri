import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Verify admin role
    const adminDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    if (!adminDoc.data()?.roles?.includes('admin')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Fetch user document
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const user = userDoc.data();

    // Fetch related stats (optional, can be expanded)
    const ordersSnapshot = await admin.firestore().collection('orders').where('user_id', '==', uid).count().get();
    const productsSnapshot = await admin.firestore().collection('products').where('seller_id', '==', uid).count().get();
    const reviewsSnapshot = await admin.firestore().collection('reviews').where('user_id', '==', uid).count().get();

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        uid: userDoc.id,
        stats: {
          order_count: ordersSnapshot.data().count,
          product_count: productsSnapshot.data().count,
          review_count: reviewsSnapshot.data().count,
        }
      },
    });
  } catch (error: any) {
    console.error(`Error fetching user in /api/admin/users/[uid]:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}
