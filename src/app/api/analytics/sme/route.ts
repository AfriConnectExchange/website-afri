import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();
const adminAuth = admin.auth();

/**
 * GET /api/analytics/sme
 * Get SME-specific analytics (US030-AC01)
 * 
 * Returns:
 * - Sales revenue (daily/weekly/monthly)
 * - Number of active adverts
 * - Engagement rate (clicks per advert)
 * - Top-selling items
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

    // Verify user is SME or seller
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists || !['sme', 'seller', 'admin'].includes(userDoc.data()?.account_type)) {
      return NextResponse.json(
        { error: 'Access denied. Only SMEs and sellers can view analytics.' },
        { status: 403 }
      );
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch orders (sales)
    const ordersSnapshot = await adminDb
      .collection('orders')
      .where('seller_id', '==', userId)
      .where('created_at', '>=', admin.firestore.Timestamp.fromDate(oneMonthAgo))
      .get();

    const orders = ordersSnapshot.docs.map(doc => ({
      ...doc.data(),
      created_at: doc.data().created_at?.toDate(),
    }));

    // Calculate revenue
    const dailyRevenue = orders
      .filter(o => o.created_at >= oneDayAgo)
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const weeklyRevenue = orders
      .filter(o => o.created_at >= oneWeekAgo)
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const monthlyRevenue = orders
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Fetch active adverts
    const advertsSnapshot = await adminDb
      .collection('adverts')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .get();

    const adverts = advertsSnapshot.docs.map(doc => doc.data());
    const activeAdverts = adverts.length;
    const totalViews = adverts.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalClicks = adverts.reduce((sum, a) => sum + (a.clicks || 0), 0);
    const engagementRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0';

    // Top-selling items (from orders)
    const productSales: Record<string, { title: string; count: number; revenue: number }> = {};
    
    orders.forEach(order => {
      (order.items || []).forEach((item: any) => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = {
            title: item.title || 'Unknown',
            count: 0,
            revenue: 0,
          };
        }
        productSales[item.product_id].count += item.quantity || 1;
        productSales[item.product_id].revenue += item.price * (item.quantity || 1);
      });
    });

    const topSellingItems = Object.entries(productSales)
      .map(([productId, data]) => ({ product_id: productId, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // US030-AC03: Respond within 5 seconds (instant)
    return NextResponse.json({
      sales_revenue: {
        daily: dailyRevenue,
        weekly: weeklyRevenue,
        monthly: monthlyRevenue,
      },
      active_adverts: activeAdverts,
      engagement: {
        rate: `${engagementRate}%`,
        total_views: totalViews,
        total_clicks: totalClicks,
      },
      top_selling_items: topSellingItems,
      total_orders: orders.length,
      currency: 'GBP',
    });

  } catch (error) {
    console.error('SME analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
