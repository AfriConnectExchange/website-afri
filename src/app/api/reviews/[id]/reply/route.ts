
import { NextRequest, NextResponse } from 'next/server'
import admin from '@/lib/firebaseAdmin'

const adminDb = admin.firestore();
const adminAuth = admin.auth();


export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    const { reply_text } = await request.json()

    if (!reply_text || reply_text.length < 10) {
      return NextResponse.json({ error: 'Reply must be at least 10 characters' }, { status: 400 })
    }

    // Get review and verify seller
    const reviewDoc = await adminDb.collection('reviews').doc(params.id).get()
    if (!reviewDoc.exists) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const review = reviewDoc.data()
    const productDoc = await adminDb.collection('products').doc(review?.product_id).get()
    const product = productDoc.data()

    if (product?.seller_id !== userId) {
      return NextResponse.json({ error: 'Only the seller can reply' }, { status: 403 })
    }

    // Add reply
    await adminDb.collection('reviews').doc(params.id).update({
      seller_reply: {
        text: reply_text,
        created_at: new Date().toISOString()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reply error:', error)
    return NextResponse.json({ error: 'Failed to add reply' }, { status: 500 })
  }
}
