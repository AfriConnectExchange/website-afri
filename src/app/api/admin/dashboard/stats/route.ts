import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Verify admin role
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    const userRoles = userData?.roles || [];

    if (!userRoles.includes('admin')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Fetch dashboard statistics
    const db = admin.firestore();

    // Total users
    const usersSnapshot = await db.collection('users').count().get();
    const totalUsers = usersSnapshot.data().count;

    // Active sellers (users with 'seller' or 'sme' role)
    const sellersSnapshot = await db.collection('users')
      .where('roles', 'array-contains-any', ['seller', 'sme'])
      .count()
      .get();
    const activeSellers = sellersSnapshot.data().count;

    // Pending KYC
    const pendingKYCSnapshot = await db.collection('kyc_submissions')
      .where('status', '==', 'pending')
      .count()
      .get();
    const pendingKYC = pendingKYCSnapshot.data().count;

    // Total products
    const productsSnapshot = await db.collection('products').count().get();
    const totalProducts = productsSnapshot.data().count;

    // Active orders (not completed or cancelled)
    const activeOrdersSnapshot = await db.collection('orders')
      .where('status', 'in', ['pending', 'confirmed', 'shipped'])
      .count()
      .get();
    const activeOrders = activeOrdersSnapshot.data().count;

    // Open disputes (placeholder for now)
    const openDisputes = 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeSellers,
        pendingKYC,
        totalProducts,
        activeOrders,
        openDisputes,
      },
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
