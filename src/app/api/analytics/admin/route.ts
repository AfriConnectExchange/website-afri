import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();
const adminAuth = admin.auth();

/**
 * GET /api/analytics/admin
 * Get platform-wide analytics for admins (US030-AC02)
 * 
 * Returns:
 * - Total SMEs onboarded
 * - Platform-wide sales revenue
 * - Total active users
 * - Regional breakdowns
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Verify user is admin
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total SMEs
    const smeSnapshot = await adminDb
      .collection('users')
      .where('account_type', 'in', ['sme', 'seller'])
      .get();
    const totalSMEs = smeSnapshot.size;

    // Platform-wide revenue
    const ordersSnapshot = await adminDb
      .collection('orders')
      .where('created_at', '>=', admin.firestore.Timestamp.fromDate(oneMonthAgo))
      .get();

    const platformRevenue = ordersSnapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().total_amount || 0);
    }, 0);

    // Total active users (logged in within last 30 days)
    const usersSnapshot = await adminDb
      .collection('users')
      .where('last_login', '>=', admin.firestore.Timestamp.fromDate(oneMonthAgo))
      .get();
    const activeUsers = usersSnapshot.size;

    // Regional breakdown
    const regionalData: Record<string, { users: number; revenue: number }> = {};

    usersSnapshot.docs.forEach(doc => {
      const country = doc.data().country || 'Unknown';
      if (!regionalData[country]) {
        regionalData[country] = { users: 0, revenue: 0 };
      }
      regionalData[country].users++;
    });

    ordersSnapshot.docs.forEach(doc => {
      const sellerDoc = smeSnapshot.docs.find(u => u.id === doc.data().seller_id);
      const country = sellerDoc?.data().country || 'Unknown';
      if (!regionalData[country]) {
        regionalData[country] = { users: 0, revenue: 0 };
      }
      regionalData[country].revenue += doc.data().total_amount || 0;
    });

    const regionalBreakdown = Object.entries(regionalData).map(([country, data]) => ({
      country,
      ...data,
    }));

    // Total products
    const productsSnapshot = await adminDb
      .collection('products')
      .where('status', '==', 'active')
      .get();
    const totalProducts = productsSnapshot.size;

    // Total transactions
    const paymentsSnapshot = await adminDb
      .collection('payments')
      .where('created_at', '>=', admin.firestore.Timestamp.fromDate(oneMonthAgo))
      .get();
    const totalTransactions = paymentsSnapshot.size;

    return NextResponse.json({
      total_smes: totalSMEs,
      platform_revenue: {
        monthly: platformRevenue,
        currency: 'GBP',
      },
      total_active_users: activeUsers,
      regional_breakdown: regionalBreakdown,
      total_products: totalProducts,
      total_transactions: totalTransactions,
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin analytics' },
      { status: 500 }
    );
  }
}
