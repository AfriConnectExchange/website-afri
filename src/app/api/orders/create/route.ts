
import { NextRequest, NextResponse } from 'next/server'
import admin from '@/lib/firebaseAdmin'

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    const body = await request.json()
    const { items, shipping_address, payment_method, subtotal, shipping, tax, total } = body

    // Validate
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 })
    }

    // Create order
    const orderData = {
      buyer_id: userId,
      items: items.map((item: any) => ({
        product_id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        seller_id: item.seller_id || ''
      })),
      shipping_address,
      payment_method,
      subtotal,
      shipping,
      tax,
      total,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const orderRef = await adminDb.collection('orders').add(orderData)

    // Update product quantities
    for (const item of items) {
      const productRef = adminDb.collection('products').doc(item.id)
      const productDoc = await productRef.get()
      if (productDoc.exists) {
        const currentQty = productDoc.data()?.quantity || 0
        await productRef.update({
          quantity: Math.max(0, currentQty - item.quantity)
        })
      }
    }

    return NextResponse.json({
      success: true,
      order_id: orderRef.id
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
