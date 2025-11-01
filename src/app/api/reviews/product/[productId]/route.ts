import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'recent'

    let query = adminDb.collection('reviews').where('product_id', '==', params.productId)

    // Apply sorting
    switch (sort) {
      case 'rating_high':
        query = query.orderBy('rating', 'desc')
        break
      case 'helpful':
        query = query.orderBy('helpful_count', 'desc')
        break
      case 'recent':
      default:
        query = query.orderBy('created_at', 'desc')
        break
    }

    const snapshot = await query.get()
    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json({ success: true, reviews })
  } catch (error) {
    console.error('Fetch reviews error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
