import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { logActivity } from '@/lib/activity-logger';
import { sendEmail } from '@/lib/email-service';
import { render } from '@react-email/render';
import KYCStatusEmail from '@/components/emails/kyc-status-template';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);

    const adminUserDoc = await admin.firestore().collection('users').doc(decoded.uid).get();
    const roles: string[] = adminUserDoc.data()?.roles || [];
    if (!roles.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, decision, reason } = await req.json();
    if (!userId || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const subRef = admin.firestore().collection('kyc_submissions').doc(userId);
    const userRef = admin.firestore().collection('users').doc(userId);

    await subRef.set({
      status: decision,
      reviewed_by: decoded.uid,
      reviewed_at: now,
      rejection_reason: decision === 'rejected' ? (reason || 'Not specified') : null,
      updated_at: now,
    }, { merge: true });

    await userRef.set({
      verification_status: decision === 'approved' ? 'verified' : 'rejected',
      kyc_verified_at: decision === 'approved' ? now : null,
      kyc_rejection_reason: decision === 'rejected' ? (reason || 'Not specified') : null,
      updated_at: now,
    }, { merge: true });

    await logActivity({ user_id: decoded.uid, action: 'kyc_review', entity_type: 'kyc_submission', entity_id: userId, changes: { decision, reason: reason || null } });

    // Fetch user info for notification/email
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {} as any;
    const userEmail: string | undefined = userData.email;
    const userName: string = userData.fullName || userData.display_name || 'there';

    // Create in-app notification
    try {
      await admin.firestore().collection('notifications').add({
        user_id: userId,
        type: 'kyc',
        title: decision === 'approved' ? 'KYC approved' : 'KYC requires attention',
        message: decision === 'approved'
          ? 'Your KYC verification is approved. You can now continue to upgrade your account and start selling.'
          : `Your KYC submission was not approved. Reason: ${(reason || 'Not specified')}. You can resubmit with corrected documents.`,
        link_url: decision === 'approved' ? '/profile' : '/kyc',
        read: false,
        priority: decision === 'approved' ? 'low' : 'medium',
        created_at: now,
      });
    } catch (e) {
      console.warn('Failed to create decision notification', e);
    }

    // Send decision email (best-effort)
    if (userEmail) {
      try {
        const html = render(
          KYCStatusEmail({
            userName,
            status: decision,
            reason: decision === 'rejected' ? (reason || 'Not specified') : undefined,
            resubmitUrl: 'https://africonnect-exchange.org/kyc'
          }) as any
        );
        const subject = decision === 'approved' ? 'Your KYC is approved' : 'Issue with your KYC submission';
        const text = `Hi ${userName},\n\n${decision === 'approved' ? 'Your KYC has been approved. You can now continue to upgrade your account and start selling.' : `We could not approve your KYC. Reason: ${(reason || 'Not specified')}. Please resubmit at /kyc.`}`;
        await sendEmail({ to: userEmail, subject, text, html }, decoded.uid);
      } catch (e) {
        console.warn('Decision email failed:', (e as any)?.message || e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('KYC review error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
