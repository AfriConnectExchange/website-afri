import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();
const adminAuth = admin.auth();

/**
 * POST /api/payments/cash-on-delivery
 * Create cash on delivery payment record (US018)
 * 
 * Acceptance Criteria:
 * - US018-AC01: Log as "Cash Pending" within 5 seconds
 * - US018-AC03: Block orders above $1,000
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const {
      order_id,
      amount,
      currency = 'GBP',
      delivery_address,
      preferred_time = 'anytime',
    } = body;

    // Validation
    if (!order_id || !amount || !delivery_address) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id, amount, delivery_address' },
        { status: 400 }
      );
    }

    // US018-AC03: Block high-value transactions
    if (amount > 1000) {
      return NextResponse.json(
        { error: 'Cash not available for high-value transactions. Please use Escrow or Online Payment.' },
        { status: 400 }
      );
    }

    // Validate delivery address
    if (!delivery_address.street || !delivery_address.city || !delivery_address.postcode || !delivery_address.phone) {
      return NextResponse.json(
        { error: 'Delivery address must include street, city, postcode, and phone' },
        { status: 400 }
      );
    }

    // Create payment record
    const paymentRef = adminDb.collection('payments').doc();
    const paymentData = {
      payment_id: paymentRef.id,
      order_id,
      user_id: userId,
      payment_method: 'cash_on_delivery',
      amount,
      currency,
      status: 'Cash Pending', // US018-AC01
      delivery_address,
      preferred_delivery_time: preferred_time,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    await paymentRef.set(paymentData);

    // Update order status
    const orderRef = adminDb.collection('orders').doc(order_id);
    await orderRef.update({
      payment_status: 'Cash Pending',
      payment_method: 'cash_on_delivery',
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      payment_id: paymentRef.id,
      status: 'Cash Pending',
      message: 'Cash on delivery order confirmed. Payment will be collected upon delivery.',
    });

  } catch (error) {
    console.error('Cash on delivery error:', error);
    return NextResponse.json(
      { error: 'Failed to process cash on delivery payment' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/payments/cash-on-delivery
 * Mark cash payment as received (US018-AC02)
 */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { payment_id } = body;

    if (!payment_id) {
      return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 });
    }

    const paymentRef = adminDb.collection('payments').doc(payment_id);
    const paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const paymentData = paymentDoc.data();

    // Get order to verify seller
    const orderDoc = await adminDb.collection('orders').doc(paymentData!.order_id).get();
    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderDoc.data();

    // Only seller can mark as received
    if (orderData!.seller_id !== userId) {
      return NextResponse.json({ error: 'Only seller can mark cash as received' }, { status: 403 });
    }

    // US018-AC02: Update to "Completed"
    await paymentRef.update({
      status: 'Completed',
      cash_received_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    await orderDoc.ref.update({
      payment_status: 'Completed',
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      status: 'Completed',
      message: 'Cash payment marked as received',
    });

  } catch (error) {
    console.error('Mark cash received error:', error);
    return NextResponse.json(
      { error: 'Failed to mark cash as received' },
      { status: 500 }
    );
  }
}
