
// API to update order status
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import type { OrderDoc } from '@/lib/firestoreTypes';
import { sendDeliveryNotificationSMS } from '@/lib/sms-service';
import { logActivity } from '@/lib/activity-logger';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const sellerId = decodedToken.uid;
    const body = await req.json();
    const { order_id, status, tracking_number } = body;

    if (!order_id || !status) {
      return NextResponse.json({ error: 'Order ID and status required' }, { status: 400 });
    }

    const db = admin.firestore();
    const orderRef = db.collection('orders').doc(order_id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderDoc.data() as OrderDoc;

    if (orderData.seller_id !== sellerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {
      status,
      updated_at: admin.firestore.Timestamp.now(),
    };

    if (status === 'shipped' && tracking_number) {
      updateData.tracking_number = tracking_number;
      updateData.shipped_at = admin.firestore.Timestamp.now();
    } else if (status === 'delivered') {
        updateData.delivered_at = admin.firestore.Timestamp.now();
    }
    
    await orderRef.update(updateData);

    const buyerDoc = await db.collection('users').doc(orderData.buyer_id).get();
    const buyerData = buyerDoc.data();

    // Send notifications based on status change
    if (buyerData?.phone) {
        if (status === 'shipped') {
            await sendDeliveryNotificationSMS(buyerData.phone, order_id, `/tracking/${order_id}`, orderData.buyer_id);
        }
    }

    await logActivity({
        user_id: sellerId,
        action: `order_${status}`,
        entity_type: 'order',
        entity_id: order_id,
        changes: { new_status: status, tracking_number: tracking_number || null }
    });

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
  }
}
