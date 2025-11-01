import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Verify admin role
    const adminDoc = await admin.firestore().collection('users').doc(uid).get();
    const adminData = adminDoc.data();
    const adminRoles = adminData?.roles || [];

    if (!adminRoles.includes('admin')) {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Fetch all users from Firestore
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .orderBy('created_at', 'desc')
      .limit(1000) // Limit for performance
      .get();

    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email || '',
        display_name: data.display_name || data.full_name || '',
        phone: data.phone || '',
        roles: data.roles || [],
        account_status: data.account_status || 'active',
        kyc_status: data.kyc_status || 'unverified',
        created_at: data.created_at || null,
      };
    });

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error: any) {
    console.error('List users error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
