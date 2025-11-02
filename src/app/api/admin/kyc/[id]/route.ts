import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);

    // Require admin role
    const adminDoc = await admin.firestore().collection('users').doc(decoded.uid).get();
    const roles: string[] = adminDoc.data()?.roles || [];
    if (!roles.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = params.id;
    const subSnap = await admin.firestore().collection('kyc_submissions').doc(userId).get();
    if (!subSnap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const submission = { id: subSnap.id, ...(subSnap.data() as any) };

    // User snapshot
    const userSnap = await admin.firestore().collection('users').doc(userId).get();
    const user = userSnap.data() || {} as any;

    // Provide a masked id number to render in UI (keep raw in doc for now if stored)
    const idNum: string | undefined = submission.id_number;
    const masked_id_number = idNum ? idNum.replace(/.(?=.{4})/g, '*') : undefined;

    return NextResponse.json({
      submission: { ...submission, masked_id_number },
      user: {
        display_name: user.display_name || user.fullName || '',
        email: user.email || '',
        roles: user.roles || [],
        verification_status: user.verification_status || 'unverified',
        created_at: user.created_at || null,
        last_login_at: user.last_login_at || null,
      }
    });
  } catch (err: any) {
    console.error('Admin KYC detail error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
