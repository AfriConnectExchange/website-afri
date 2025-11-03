import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const adminDb = admin.firestore();

/**
 * GET /api/products/seller
 * Get all products for the authenticated seller
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Fetch all products for this seller
    const productsSnapshot = await adminDb
      .collection('products')
      .where('seller_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const products = productsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Handle both Firestore Timestamp and ISO string formats
        created_at: data.created_at?.toMillis 
          ? data.created_at.toMillis() 
          : (data.created_at ? new Date(data.created_at).getTime() : null),
        updated_at: data.updated_at?.toMillis 
          ? data.updated_at.toMillis() 
          : (data.updated_at ? new Date(data.updated_at).getTime() : null),
      };
    });

    return NextResponse.json({
      success: true,
      products,
      total: products.length,
    });

  } catch (error: any) {
    console.error('Failed to fetch seller products:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
