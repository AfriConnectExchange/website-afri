// API to fetch seller's orders
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import type { OrderDoc } from '@/lib/firestoreTypes';

export async function GET(req: Request) {
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
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const db = admin.firestore();
    let query = db.collection('orders')
      .where('seller_id', '==', sellerId)
      .orderBy('created_at', 'desc')
      .limit(100);

    if (status && status !== 'all') {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.get();

    const orders: any[] = [];
    snapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}
