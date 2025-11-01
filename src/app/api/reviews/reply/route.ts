// API to reply to a review
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import type { ReviewDoc } from '@/lib/firestoreTypes';

export async function POST(req: Request) {
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
    const { review_id, reply_message } = body;

    if (!review_id || !reply_message) {
      return NextResponse.json({ error: 'Review ID and reply message required' }, { status: 400 });
    }

    const db = admin.firestore();
    const reviewRef = db.collection('reviews').doc(review_id);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const reviewData = reviewDoc.data() as ReviewDoc;

    // Verify seller owns this review
    if (reviewData.seller_id !== sellerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if already replied
    if (reviewData.seller_reply) {
      return NextResponse.json({ error: 'You have already replied to this review' }, { status: 400 });
    }

    // Add reply
    await reviewRef.update({
      seller_reply: {
        message: reply_message,
        replied_at: admin.firestore.Timestamp.now(),
      },
      updated_at: admin.firestore.Timestamp.now(),
    });

    // TODO: Send notification to reviewer

    return NextResponse.json({
      success: true,
      message: 'Reply posted successfully',
    });
  } catch (error: any) {
    console.error('Error posting reply:', error);
    return NextResponse.json({ error: error.message || 'Failed to post reply' }, { status: 500 });
  }
}
