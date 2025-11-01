// API Route to list seller's products
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import type { Product } from '@/lib/productTypes';

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
    
    // Query parameters
    const status = searchParams.get('status'); // 'all', 'active', 'draft', 'sold', etc.
    const limit = parseInt(searchParams.get('limit') || '50');
    const category = searchParams.get('category');

    const db = admin.firestore();
    let query = db.collection('products')
      .where('seller_id', '==', sellerId)
      .orderBy('created_at', 'desc')
      .limit(limit);

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.where('status', '==', status) as any;
    }

    // Filter by category if provided
    if (category) {
      query = query.where('category_id', '==', category) as any;
    }

    const snapshot = await query.get();

    const products: (Product & { id: string })[] = [];
    snapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data() as Product,
      });
    });

    // Get stats
    const statsSnapshot = await db.collection('products')
      .where('seller_id', '==', sellerId)
      .get();

    const stats = {
      total: statsSnapshot.size,
      active: 0,
      draft: 0,
      sold: 0,
      delisted: 0,
    };

    statsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'active') stats.active++;
      if (data.status === 'draft') stats.draft++;
      if (data.status === 'sold') stats.sold++;
      if (data.status === 'delisted') stats.delisted++;
    });

    return NextResponse.json({
      success: true,
      products,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}
