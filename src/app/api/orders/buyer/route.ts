
// API to fetch buyer's orders
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

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

    const buyerId = decodedToken.uid;
    
    const db = admin.firestore();
    const query = db.collection('orders')
      .where('buyer_id', '==', buyerId)
      .orderBy('created_at', 'desc')
      .limit(100);

    const snapshot = await query.get();

    const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: any) {
    console.error('Error fetching buyer orders:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}
