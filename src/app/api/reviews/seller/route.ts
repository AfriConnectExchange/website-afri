// API to fetch seller's reviews
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import type { ReviewDoc } from '@/lib/firestoreTypes';

export async function GET(req: Request) {
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
    const db = admin.firestore();

    // Fetch reviews
    const reviewsQuery = await db.collection('reviews')
      .where('seller_id', '==', sellerId)
      .where('status', '==', 'active')
      .orderBy('created_at', 'desc')
      .limit(100)
      .get();

    const reviews: any[] = [];
    let totalRating = 0;
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviewsQuery.forEach(doc => {
      const data = doc.data() as ReviewDoc;
      reviews.push({
        id: doc.id,
        ...data,
      });
      totalRating += data.rating;
      ratingBreakdown[data.rating as keyof typeof ratingBreakdown]++;
    });

    const stats = {
      total_reviews: reviews.length,
      average_rating: reviews.length > 0 ? totalRating / reviews.length : 0,
      rating_breakdown: ratingBreakdown,
    };

    return NextResponse.json({
      success: true,
      reviews,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}
