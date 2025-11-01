import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebaseAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    const orderId = params.orderId

    // Get order
    const orderDoc = await adminDb.collection('orders').doc(orderId).get()
    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = { id: orderDoc.id, ...orderDoc.data() }

    // Verify ownership (buyer or seller)
    if (order.buyer_id !== userId && !order.items.some((item: any) => item.seller_id === userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If tracking number exists, fetch live updates from courier API
    if (order.tracking_number && order.courier_name) {
      try {
        // TODO: Integrate with actual courier APIs (DHL, FedEx, etc.)
        // For now, return mock data
        const courierUpdates = await fetchCourierTracking(order.tracking_number, order.courier_name)
        order.tracking_updates = courierUpdates
      } catch (courierError) {
        console.error('Courier API error:', courierError)
        // Fall back to database tracking updates
      }
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Track order error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tracking information' },
      { status: 500 }
    )
  }
}

// Mock courier API integration
async function fetchCourierTracking(trackingNumber: string, courier: string) {
  // TODO: Replace with actual courier API calls
  return [
    {
      status: 'Package received',
      location: 'London Distribution Center',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Your package has been received at our facility'
    },
    {
      status: 'In transit',
      location: 'Birmingham Hub',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Package is on the way to destination'
    },
    {
      status: 'Out for delivery',
      location: 'Manchester Delivery Station',
      timestamp: new Date().toISOString(),
      description: 'Package is out for delivery today'
    }
  ]
}
