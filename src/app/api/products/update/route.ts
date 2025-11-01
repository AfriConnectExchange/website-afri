// API Route to update an existing product
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import type { Product } from '@/lib/productTypes';

export async function PUT(req: Request) {
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
    const { product_id, ...updates } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const db = admin.firestore();
    const productRef = db.collection('products').doc(product_id);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const productData = productDoc.data() as Product;

    // Verify seller owns this product
    if (productData.seller_id !== sellerId) {
      return NextResponse.json({ error: 'Forbidden: You can only update your own products' }, { status: 403 });
    }

    // Prepare update object
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Update published_at if status changed to active
    if (updates.status === 'active' && productData.status !== 'active') {
      updateData.published_at = new Date().toISOString();
    }

    // Update slug if title changed
    if (updates.title && updates.title !== productData.title) {
      updateData.slug = updates.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    // Update search keywords if title or tags changed
    if (updates.title || updates.tags) {
      updateData.search_keywords = [
        ...(updates.title || productData.title).toLowerCase().split(' '),
        ...(updates.tags || productData.tags).map((t: string) => t.toLowerCase()),
        updates.category_id || productData.category_id,
      ];
    }

    // Update images array if provided
    if (updates.images) {
      updateData.images = updates.images.map((img: any, index: number) => ({
        url: typeof img === 'string' ? img : img.url,
        alt: updates.title || productData.title,
        order: index,
        is_primary: index === 0,
      }));
    }

    // Update category count if category changed
    if (updates.category_id && updates.category_id !== productData.category_id) {
      // Decrement old category
      await db.collection('categories').doc(productData.category_id).update({
        product_count: admin.firestore.FieldValue.increment(-1),
      });
      // Increment new category
      await db.collection('categories').doc(updates.category_id).update({
        product_count: admin.firestore.FieldValue.increment(1),
      });
    }

    // Update location text if location changed
    if (updates.location) {
      updateData.location_text = `${updates.location.city || ''}${updates.location.city && updates.location.country ? ', ' : ''}${updates.location.country}`;
    }

    await productRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}
