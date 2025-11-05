
import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { cartItems, subtotal, total, paymentMethod, shippingAddress } = body;

    // Validate
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'No items in order' },
        { status: 400 }
      );
    }
    
    // Group items by seller to create separate orders if necessary
    const ordersBySeller: { [key: string]: any[] } = {};
    for (const item of cartItems) {
        if (!item.seller_id) {
            return NextResponse.json({ error: `Missing seller information for product ${item.title}`}, { status: 400 });
        }
        if (!ordersBySeller[item.seller_id]) {
            ordersBySeller[item.seller_id] = [];
        }
        ordersBySeller[item.seller_id].push({
            product_id: item.product_id,
            title: item.title,
            quantity: item.quantity,
            price: item.price,
        });
    }

    const db = admin.firestore();
    const orderPromises = Object.keys(ordersBySeller).map(async (sellerId) => {
        const sellerItems = ordersBySeller[sellerId];
        const sellerSubtotal = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // Create order
        const orderData = {
          buyer_id: userId,
          seller_id: sellerId,
          items: sellerItems,
          shipping_address: shippingAddress,
          payment_method: paymentMethod,
          subtotal: sellerSubtotal,
          shipping: 0, // No platform shipping
          tax: 0, // No platform tax
          total: sellerSubtotal, // Total for this seller's order
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const orderRef = await db.collection('orders').add(orderData);

        // Update product quantities
        for (const item of sellerItems) {
            const productRef = db.collection('products').doc(item.product_id);
            const productDoc = await productRef.get();
            if (productDoc.exists) {
                const currentQty = productDoc.data()?.quantity_available || 0;
                await productRef.update({
                quantity_available: Math.max(0, currentQty - item.quantity),
                });
            }
        }
        return orderRef.id;
    });

    const orderIds = await Promise.all(orderPromises);

    return NextResponse.json({
      success: true,
      order_ids: orderIds,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
