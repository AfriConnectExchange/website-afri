import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();
const adminAuth = admin.auth();

/**
 * POST /api/escrow/create
 * Hold funds in escrow until delivery confirmed (US021-AC01)
 * 
 * Acceptance Criteria:
 * - US021-AC01: Mark funds as "Escrowed" and lock from seller
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
      payment_details, // Card/wallet token from payment form
    } = body;

    // Validation
    if (!order_id || !amount || !payment_details) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id, amount, payment_details' },
        { status: 400 }
      );
    }

    // Get order details
    const orderRef = adminDb.collection('orders').doc(order_id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderDoc.data();

    // Verify user owns this order
    if (orderData!.buyer_id !== userId) {
      return NextResponse.json({ error: 'You do not own this order' }, { status: 403 });
    }

    // Calculate escrow fee (2.5% + $0.30)
    const escrowFee = amount * 0.025 + 0.30;
    const totalAmount = amount + escrowFee;

    // TODO: Process payment through gateway
    // Simulate payment processing
    const paymentSuccess = await simulateEscrowPayment(payment_details, totalAmount);

    if (!paymentSuccess) {
      return NextResponse.json(
        { error: 'Payment failed. Please check your payment details and try again.' },
        { status: 400 }
      );
    }

    // US021-AC01: Create escrow record
    const escrowRef = adminDb.collection('escrow').doc();
    const escrowData = {
      escrow_id: escrowRef.id,
      order_id,
      buyer_id: userId,
      seller_id: orderData!.seller_id,
      amount, // Order amount
      escrow_fee: escrowFee,
      total_amount: totalAmount,
      currency,
      status: 'Escrowed', // Funds locked
      payment_method: payment_details.method || 'card',
      payment_transaction_id: `ESC${Date.now()}`,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      delivery_confirmed_by_buyer: false,
      delivery_confirmed_by_seller: false,
    };

    await escrowRef.set(escrowData);

    // Update order with escrow info
    await orderRef.update({
      payment_status: 'Escrowed',
      payment_method: 'escrow',
      escrow_id: escrowRef.id,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create payment record
    const paymentRef = adminDb.collection('payments').doc();
    await paymentRef.set({
      payment_id: paymentRef.id,
      order_id,
      user_id: userId,
      payment_method: 'escrow',
      amount: totalAmount,
      currency,
      status: 'Escrowed',
      escrow_id: escrowRef.id,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify both parties
    await createEscrowNotifications(userId, orderData!.seller_id, escrowRef.id, amount, currency);

    return NextResponse.json({
      success: true,
      escrow_id: escrowRef.id,
      amount,
      escrow_fee: escrowFee,
      total_paid: totalAmount,
      status: 'Escrowed',
      message: 'Funds secured in escrow. Will be released to seller after delivery confirmation.',
    });

  } catch (error) {
    console.error('Escrow creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create escrow payment' },
      { status: 500 }
    );
  }
}

/**
 * Simulate escrow payment processing
 * TODO: Replace with actual Stripe/PayPal integration
 */
async function simulateEscrowPayment(details: any, amount: number): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
  
  // Basic validation
  if (!details.cardholderName || !details.billingPostcode) {
    return false;
  }

  // 95% success rate
  return Math.random() > 0.05;
}

/**
 * Create notifications for escrow creation
 */
async function createEscrowNotifications(
  buyerId: string,
  sellerId: string,
  escrowId: string,
  amount: number,
  currency: string
): Promise<void> {
  const notifications = [
    {
      user_id: buyerId,
      type: 'order',
      title: 'Payment Secured in Escrow',
      message: `Your payment of ${currency} ${amount.toFixed(2)} is safely held in escrow until delivery.`,
      action_url: `/orders`,
      read: false,
      created_at: admin.firestore.Timestamp.now().toDate().toISOString(),
      delivered_at: admin.firestore.Timestamp.now().toDate().toISOString(),
    },
    {
      user_id: sellerId,
      type: 'order',
      title: 'Escrow Payment Received',
      message: `Payment of ${currency} ${amount.toFixed(2)} is held in escrow. Ship the order to release funds.`,
      action_url: `/vendor/orders`,
      read: false,
      created_at: admin.firestore.Timestamp.now().toDate().toISOString(),
      delivered_at: admin.firestore.Timestamp.now().toDate().toISOString(),
    },
  ];

  const batch = adminDb.batch();
  notifications.forEach(notif => {
    const ref = adminDb.collection('notifications').doc();
    batch.set(ref, notif);
  });
  await batch.commit();
}
