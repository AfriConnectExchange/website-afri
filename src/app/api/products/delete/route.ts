// API Route to delete a product
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import type { Product } from '@/lib/productTypes';

export async function DELETE(req: Request) {
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
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const db = admin.firestore();
    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const productData = productDoc.data() as Product;

    // Verify seller owns this product
    if (productData.seller_id !== sellerId) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own products' }, { status: 403 });
    }

    // Decrement category count
    await db.collection('categories').doc(productData.category_id).update({
      product_count: admin.firestore.FieldValue.increment(-1),
    });

    // Delete the product
    await productRef.delete();

    // TODO: Also delete associated images from Firebase Storage
    // This would require parsing image URLs and deleting from Storage

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}
