import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { verifyAdminRequest } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await verifyAdminRequest(req);
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = admin.firestore().collection('disputes').orderBy('created_at', 'desc');

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    const disputesSnapshot = await query.limit(50).get();
    const disputes = disputesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, disputes });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
