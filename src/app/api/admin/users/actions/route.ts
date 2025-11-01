import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

async function logAdminAction(adminId: string, targetUserId: string, action: string, reason: string) {
  await admin.firestore().collection('audit_logs').add({
    admin_id: adminId,
    target_user_id: targetUserId,
    action: action,
    reason: reason,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const adminId = decodedToken.uid;

    const { userId, action, reason } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ success: false, error: 'User ID and action are required' }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ success: false, error: 'A reason is required for this action' }, { status: 400 });
    }

    const userRef = admin.firestore().collection('users').doc(userId);

    switch (action) {
      case 'suspend':
        await userRef.update({ account_status: 'suspended' });
        break;
      case 'unsuspend':
        await userRef.update({ account_status: 'active' });
        break;
      case 'deactivate':
        await userRef.update({ account_status: 'deactivated' });
        // Optionally, disable the user in Firebase Auth
        await admin.auth().updateUser(userId, { disabled: true });
        break;
      case 'verify_kyc':
        await userRef.update({ kyc_status: 'verified' });
        break;
      case 'grant_admin':
        await userRef.update({ roles: admin.firestore.FieldValue.arrayUnion('admin') });
        break;
      case 'revoke_admin':
        await userRef.update({ roles: admin.firestore.FieldValue.arrayRemove('admin') });
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    await logAdminAction(adminId, userId, action, reason);

    return NextResponse.json({ success: true, message: `Action '${action}' completed successfully.` });

  } catch (error: any) {
    console.error('User action error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to perform action' },
      { status: 500 }
    );
  }
}
