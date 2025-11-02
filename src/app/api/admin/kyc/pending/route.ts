import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);

    // Minimal role check: user must have 'admin' role in users doc
    const userDoc = await admin.firestore().collection('users').doc(decoded.uid).get();
    const roles: string[] = userDoc.data()?.roles || [];
    if (!roles.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const snap = await admin.firestore().collection('kyc_submissions')
      .where('status', '==', 'pending')
      .limit(50)
      .get();

    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    return NextResponse.json({ items });
  } catch (err: any) {
    console.error('Pending KYC error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
