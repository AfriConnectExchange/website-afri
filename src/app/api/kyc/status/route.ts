import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ status: 'unverified' });
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data() || {};

    // If there is an explicit verification_status on user, use it.
    let status: 'unverified' | 'pending' | 'verified' | 'rejected' = userData.verification_status || 'unverified';

    // If pending or unverified, check submission doc to refine
    const subDoc = await admin.firestore().collection('kyc_submissions').doc(uid).get();
    let reason: string | undefined = undefined;
    if (subDoc.exists) {
      const s = subDoc.data()?.status;
      if (s === 'approved') status = 'verified';
      else if (s === 'rejected' || s === 'requires_resubmission') {
        status = 'rejected';
        reason = subDoc.data()?.rejection_reason || userData.kyc_rejection_reason;
      }
      else if (s === 'pending') status = 'pending';
    }

    return NextResponse.json({ status, reason: reason || null });
  } catch (err) {
    return NextResponse.json({ status: 'unverified' });
  }
}
