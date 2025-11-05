
import { NextRequest, NextResponse } from 'next/server'
import admin from '@/lib/firebaseAdmin'

const adminDb = admin.firestore();
const adminAuth = admin.auth();

const BANNED_WORDS = ['spam', 'scam', 'fake', 'fraud'] // Add more as needed

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
    const { product_id, order_id, rating, review_text, images = [] } = body

    // Validate inputs
    if (!product_id || !order_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    if (review_text.length < 20) {
      return NextResponse.json({ error: 'Review must be at least 20 characters' }, { status: 400 })
    }

    // Check for banned words
    const textLower = review_text.toLowerCase()
    const hasBannedWord = BANNED_WORDS.some(word => textLower.includes(word))
    if (hasBannedWord) {
      return NextResponse.json({ error: 'Review contains inappropriate content' }, { status: 400 })
    }

    // Verify order exists and user is buyer
    const orderDoc = await adminDb.collection('orders').doc(order_id).get()
    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderDoc.data()
    if (order?.buyer_id !== userId) {
      return NextResponse.json({ error: 'Only verified buyers can review' }, { status: 403 })
    }

    // Check if already reviewed
    const existingReview = await adminDb
      .collection('reviews')
      .where('order_id', '==', order_id)
      .where('user_id', '==', userId)
      .get()

    if (!existingReview.empty) {
      return NextResponse.json({ error: 'You have already reviewed this order' }, { status: 400 })
    }

    // Check 30-day window
    const orderDate = new Date(order.created_at)
    const now = new Date()
    const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceOrder > 30) {
      return NextResponse.json({ error: 'Review window has expired (30 days)' }, { status: 400 })
    }

    // Create review
    const reviewData = {
      product_id,
      order_id,
      user_id: userId,
      user_name: decodedToken.name || 'Anonymous',
      user_avatar: decodedToken.picture || null,
      rating,
      review_text,
      images,
      helpful_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const reviewRef = await adminDb.collection('reviews').add(reviewData)

    // Update product average rating
    const reviewsSnapshot = await adminDb
      .collection('reviews')
      .where('product_id', '==', product_id)
      .get()

    const allRatings = reviewsSnapshot.docs.map(doc => doc.data().rating)
    const averageRating = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length

    await adminDb.collection('products').doc(product_id).update({
      average_rating: averageRating,
      review_count: allRatings.length
    })

    return NextResponse.json({
      success: true,
      review_id: reviewRef.id,
      average_rating: averageRating
    })
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
