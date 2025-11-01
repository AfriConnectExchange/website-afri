import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();
const adminAuth = admin.auth();

/**
 * POST /api/payments/online
 * Process online payments via card, wallet, or PayPal (US019)
 * 
 * Acceptance Criteria:
 * - US019-AC01: Process payment and mark as "Paid" within 10 seconds
 * - US019-AC02: Reject invalid/declined credentials
 * - US019-AC03: Send email/SMS confirmation within 60 seconds
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
      payment_method, // 'card', 'wallet', 'paypal'
      payment_details, // Contains card token, wallet ID, or PayPal token
    } = body;

    // Validation
    if (!order_id || !amount || !payment_method || !payment_details) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id, amount, payment_method, payment_details' },
        { status: 400 }
      );
    }

    if (!['card', 'wallet', 'paypal'].includes(payment_method)) {
      return NextResponse.json(
        { error: 'Invalid payment method. Use: card, wallet, or paypal' },
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

    // TODO: Integrate with actual payment gateway (Stripe, PayPal, etc.)
    // For now, simulate payment processing
    const paymentSuccess = await simulatePaymentProcessing(payment_method, payment_details, amount);

    if (!paymentSuccess) {
      // US019-AC02: Reject invalid/declined payments
      return NextResponse.json(
        { error: 'Payment failed. Please try again or use another method.' },
        { status: 400 }
      );
    }

    // US019-AC01: Create payment record and mark as "Paid"
    const paymentRef = adminDb.collection('payments').doc();
    const paymentData = {
      payment_id: paymentRef.id,
      order_id,
      user_id: userId,
      payment_method: `online_${payment_method}`,
      amount,
      currency,
      status: 'Paid',
      payment_details: {
        method: payment_method,
        last4: payment_details.last4 || 'N/A',
        transaction_id: `TXN${Date.now()}`, // Mock transaction ID
      },
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    await paymentRef.set(paymentData);

    // Update order status
    await orderRef.update({
      payment_status: 'Paid',
      payment_method: `online_${payment_method}`,
      payment_id: paymentRef.id,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // US019-AC03: Send confirmation notifications
    // TODO: Implement actual email/SMS service
    await sendPaymentConfirmation(userId, orderData!.seller_id, paymentRef.id, amount, currency);

    return NextResponse.json({
      success: true,
      payment_id: paymentRef.id,
      transaction_id: paymentData.payment_details.transaction_id,
      status: 'Paid',
      message: 'Payment processed successfully',
    });

  } catch (error) {
    console.error('Online payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process online payment' },
      { status: 500 }
    );
  }
}

/**
 * Simulate payment gateway processing
 * TODO: Replace with actual Stripe/PayPal integration
 */
async function simulatePaymentProcessing(
  method: string,
  details: any,
  amount: number
): Promise<boolean> {
  // Simulate 95% success rate
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

  // Basic validation
  if (method === 'card' && !details.card_token) {
    return false;
  }
  if (method === 'wallet' && !details.wallet_id) {
    return false;
  }
  if (method === 'paypal' && !details.paypal_token) {
    return false;
  }

  // Random 5% failure rate
  return Math.random() > 0.05;
}

/**
 * Send payment confirmation to buyer and seller
 * TODO: Integrate with actual email/SMS service
 */
async function sendPaymentConfirmation(
  buyerId: string,
  sellerId: string,
  paymentId: string,
  amount: number,
  currency: string
): Promise<void> {
  try {
    // Create notifications for both parties
    const notifications = [
      {
        user_id: buyerId,
        type: 'order',
        title: 'Payment Successful',
        message: `Your payment of ${currency} ${amount.toFixed(2)} has been processed successfully.`,
        action_url: `/orders`,
        read: false,
        created_at: admin.firestore.Timestamp.now().toDate().toISOString(),
        delivered_at: admin.firestore.Timestamp.now().toDate().toISOString(),
      },
      {
        user_id: sellerId,
        type: 'order',
        title: 'Payment Received',
        message: `Payment of ${currency} ${amount.toFixed(2)} received for your order.`,
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

    // TODO: Send actual email/SMS here
    console.log(`Payment confirmation sent for payment ${paymentId}`);
  } catch (error) {
    console.error('Failed to send payment confirmation:', error);
    // Don't fail the payment if notifications fail
  }
}
