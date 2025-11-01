// API to check user's KYC status
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

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

    const userId = decodedToken.uid;
    const db = admin.firestore();

    // Check user doc for verification status
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ 
        success: true, 
        status: 'unverified',
        kyc_completed: false 
      });
    }

    // Check if there's a pending or rejected submission
    const submissionsQuery = await db.collection('kyc_submissions')
      .where('user_id', '==', userId)
      .orderBy('submitted_at', 'desc')
      .limit(1)
      .get();

    let latestSubmission = null;
    if (!submissionsQuery.empty) {
      const doc = submissionsQuery.docs[0];
      latestSubmission = { id: doc.id, ...doc.data() };
    }

    return NextResponse.json({
      success: true,
      status: userData.verification_status || 'unverified',
      kyc_completed: userData.kyc_completed || false,
      rejection_reason: latestSubmission?.rejection_reason || null,
      submitted_at: latestSubmission?.submitted_at || null,
    });
  } catch (error: any) {
    console.error('Error checking KYC status:', error);
    return NextResponse.json({ error: error.message || 'Failed to check status' }, { status: 500 });
  }
}
