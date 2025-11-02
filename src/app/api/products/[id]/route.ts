import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { logActivity } from '@/lib/activity-logger';

const adminDb = admin.firestore();

/**
 * DELETE /api/products/[id]
 * Delete a product listing (seller must own it)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const productId = params.id;

    // Get product to verify ownership
    const productDoc = await adminDb.collection('products').doc(productId).get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const productData = productDoc.data();

    // Verify seller owns this product
    if (productData?.seller_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this product' },
        { status: 403 }
      );
    }

    // Delete the product
    await productDoc.ref.delete();

    // Log activity
    await logActivity({
      userId,
      action: 'product_deleted',
      category: 'product',
      status: 'success',
      metadata: {
        product_id: productId,
        title: productData.title,
      },
    });

    console.log(`Product deleted: ${productId} by seller ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });

  } catch (error: any) {
    console.error('Failed to delete product:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/products/[id]
 * Update a product listing (seller must own it)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const productId = params.id;
    const body = await req.json();

    // Get product to verify ownership
    const productDoc = await adminDb.collection('products').doc(productId).get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const productData = productDoc.data();

    // Verify seller owns this product
    if (productData?.seller_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this product' },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: admin.firestore.Timestamp.now(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.stock_quantity !== undefined) updateData.stock_quantity = body.stock_quantity;
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.shipping !== undefined) updateData.shipping = body.shipping;
    if (body.payment_methods !== undefined) updateData.payment_methods = body.payment_methods;

    // Update product
    await productDoc.ref.update(updateData);

    // Log activity
    await logActivity({
      userId,
      action: 'product_updated',
      category: 'product',
      status: 'success',
      metadata: {
        product_id: productId,
        fields_updated: Object.keys(updateData),
      },
    });

    console.log(`Product updated: ${productId} by seller ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
    });

  } catch (error: any) {
    console.error('Failed to update product:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}
