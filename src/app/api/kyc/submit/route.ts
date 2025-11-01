// API to submit KYC for review
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import type { KYCSubmissionDoc } from '@/lib/firestoreTypes';

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

    const userId = decodedToken.uid;
    const body = await req.json();

    const {
      id_type,
      id_number,
      date_of_birth,
      nationality,
      id_front_url,
      id_back_url,
      selfie_url,
    } = body;

    // Validation
    if (!id_type || !id_number || !date_of_birth || !id_front_url || !selfie_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = admin.firestore();

    // Create KYC submission
    const submission: Omit<KYCSubmissionDoc, 'id'> = {
      user_id: userId,
      id_type,
      id_number,
      date_of_birth,
      nationality: nationality || 'United Kingdom',
      id_front_url,
      id_back_url,
      selfie_url,
      status: 'pending',
      submitted_at: admin.firestore.Timestamp.now(),
    };

    await db.collection('kyc_submissions').add(submission);

    // Update user doc
    await db.collection('users').doc(userId).update({
      verification_status: 'pending',
      kyc_submitted_at: admin.firestore.Timestamp.now(),
      kyc_documents: {
        id_type,
        id_number,
        id_front_url,
        id_back_url,
        selfie_url,
      },
      updated_at: admin.firestore.Timestamp.now(),
    });

    // TODO: Send email notification to admins for review
    // TODO: Send confirmation email to user

    return NextResponse.json({
      success: true,
      message: 'KYC submitted successfully. We will review within 24-48 hours.',
    });
  } catch (error: any) {
    console.error('Error submitting KYC:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit' }, { status: 500 });
  }
}
