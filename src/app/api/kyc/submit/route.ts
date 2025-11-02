import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { logActivity } from '@/lib/activity-logger';
import { sendEmail } from '@/lib/email-service';

export async function POST(req: NextRequest) {
  try {
    // Require auth via Firebase ID token cookie or header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : undefined;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json();
    const { personal, documents } = body || {};
    if (!personal || !documents || !documents.idDocumentUrl || !documents.proofOfAddressUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    // Write a submission document; use a deterministic id so re-submits overwrite pending
    const subRef = admin.firestore().collection('kyc_submissions').doc(uid);
    await subRef.set({
      user_id: uid,
      id_type: personal.idType,
      id_number: personal.idNumber,
      id_front_url: documents.idDocumentUrl,
      // optional back for driver license can be added in UI later
      selfie_url: null,
      proof_of_address_url: documents.proofOfAddressUrl,
      date_of_birth: personal.dateOfBirth ?? null,
      nationality: personal.nationality ?? null,
      status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: null,
      submitted_at: now,
      updated_at: now,
    }, { merge: true });

    // Update user's verification status to pending
    const userRef = admin.firestore().collection('users').doc(uid);
    await userRef.set({
      verification_status: 'pending',
      kyc_submitted_at: now,
    }, { merge: true });

    // Fetch user details for email/notification
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {} as any;
    const userEmail: string | undefined = userData.email || decoded.email;
    const userName: string = userData.fullName || userData.display_name || decoded.name || 'there';

    // Create in-app notification (system type)
    try {
      await admin.firestore().collection('notifications').add({
        user_id: uid,
        type: 'system',
        title: 'KYC submission received',
        message: 'Thanks! Your KYC documents were submitted and are pending review. We’ll email you when the review is complete.',
        link_url: '/kyc',
        read: false,
        priority: 'low',
        created_at: now,
      });
    } catch (e) {
      console.warn('Failed to create KYC submission notification:', e);
    }

    // Send confirmation email (best-effort; do not block response)
    if (userEmail) {
      const subject = 'We\'ve received your KYC submission';
      const text = `Hi ${userName},\n\nThanks for submitting your KYC documents. Our team will review your information within 2-3 business days. We\'ll email you as soon as the review is complete.\n\nYou can check your status anytime here: https://africonnect-exchange.org/kyc\n\n— AfriConnect Team`;
      const html = `
        <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111">
          <h2>We\'ve received your KYC submission</h2>
          <p>Hi ${userName},</p>
          <p>Thanks for submitting your KYC documents. Our team will review your information within <strong>2–3 business days</strong>. We\'ll email you as soon as the review is complete.</p>
          <p><a href="https://africonnect-exchange.org/kyc" style="color:#2563eb">View your KYC status</a></p>
          <p style="color:#6b7280;font-size:12px">If you didn\'t request this, please contact support.</p>
          <p>— AfriConnect Team</p>
        </div>`;
      try {
        await sendEmail({ to: userEmail, subject, text, html }, uid);
      } catch (e) {
        console.warn('KYC submission email failed:', (e as any)?.message || e);
      }
    }

    // Log
    await logActivity({ user_id: uid, action: 'kyc_submitted', entity_type: 'kyc_submission', entity_id: uid, changes: { id_type: personal.idType } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('KYC submit error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
 
