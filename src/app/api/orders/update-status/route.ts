// API to update order status
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import type { OrderDoc } from '@/lib/firestoreTypes';

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

    // Verify seller owns this order
    if (orderData.seller_id !== sellerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prepare update
    const updateData: any = {
      status,
      updated_at: admin.firestore.Timestamp.now(),
    };

    // Add timestamp based on status
    if (status === 'confirmed') {
      updateData.confirmed_at = admin.firestore.Timestamp.now();
    } else if (status === 'shipped') {
      updateData.shipped_at = admin.firestore.Timestamp.now();
      if (tracking_number) {
        updateData.tracking_number = tracking_number;
      }
    } else if (status === 'delivered') {
      updateData.delivered_at = admin.firestore.Timestamp.now();
    } else if (status === 'completed') {
      updateData.completed_at = admin.firestore.Timestamp.now();
      // TODO: Trigger escrow release here
    }

    await orderRef.update(updateData);

    // TODO: Send notification to buyer about status update
    // TODO: Log activity

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
  }
}
