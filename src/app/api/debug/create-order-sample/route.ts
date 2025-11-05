import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import createOrders from '@/lib/order-helpers';

/**
 * Dev-only test endpoint to exercise createOrders without Stripe.
 * Protect with DEBUG_CREATE_ORDER_SECRET environment variable in production.
 */
export async function POST(request: NextRequest) {
  try {
    // Simple protection: require secret when in production
    const secret = request.headers.get('x-debug-secret');
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.DEBUG_CREATE_ORDER_SECRET) {
        return NextResponse.json({ error: 'Debug endpoint not configured' }, { status: 403 });
      }
      if (!secret || secret !== process.env.DEBUG_CREATE_ORDER_SECRET) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const db = admin.firestore();

    // Find any user to use as seller/buyer fallback
    const usersSnap = await db.collection('users').limit(1).get();
    if (usersSnap.empty) {
      return NextResponse.json({ error: 'No users found in Firestore. Create a user first.' }, { status: 400 });
    }
    const userDoc = usersSnap.docs[0];
    const sellerId = userDoc.id;
    const sellerData = userDoc.data();

    // Build a simple sample cart item
    const sampleItem = {
      id: `sample-product-${Date.now()}`,
      title: 'Sample Product (Test)',
      quantity: 1,
      price: 9.99,
      seller_id: sellerId,
      images: [],
    };

    const buyerId = sellerId; // reuse the same user for buyer/seller in tests
    const buyerData = { email: sellerData.email || null, full_name: sellerData.full_name || sellerData.display_name || 'Test User', phone: sellerData.phone || null };

    const created = await createOrders({
      buyerId,
      buyerData,
      cartItems: [sampleItem],
      paymentMethod: 'card',
      payment_details: { transactionId: `dbg-${Date.now()}`, stripe_session: `dbg-${Date.now()}` },
    } as any);

    return NextResponse.json({ success: true, created });
  } catch (err: any) {
    console.error('Debug create-order error:', err);
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}
