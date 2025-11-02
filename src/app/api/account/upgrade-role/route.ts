import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

// Secure endpoint for a user to upgrade their own role to seller/sme
export async function POST(req: NextRequest) {
  try {
    const { target } = await req.json();
    if (target !== 'seller' && target !== 'sme') {
      return NextResponse.json({ success: false, error: 'Invalid target role' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const uid = decoded.uid;
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }
    const data = snap.data() || {} as any;

    // Require KYC verified before any seller upgrade
    if (data.verification_status !== 'verified') {
      return NextResponse.json({ success: false, error: 'KYC is required before upgrading.' }, { status: 403 });
    }

    const roles: string[] = Array.isArray(data.roles) ? data.roles : ['buyer'];
    if (!roles.includes(target)) roles.push(target);
    // Ensure at least buyer remains
    if (!roles.includes('buyer')) roles.unshift('buyer');

    await userRef.update({
      roles,
      seller_type: target,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, roles, seller_type: target });
  } catch (error: any) {
    console.error('upgrade-role error', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to upgrade role' }, { status: 500 });
  }
}
