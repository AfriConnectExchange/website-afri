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

    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {} as any;

    if (userData.verification_status === 'verified') {
      return NextResponse.json({ error: 'Your account is already verified.' }, { status: 409 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
    }

    const { personal, documents } = body as any;
    if (!personal || typeof personal !== 'object') {
      return NextResponse.json({ error: 'Missing personal details.' }, { status: 400 });
    }

    const requiredPersonalFields = ['fullName', 'dateOfBirth', 'nationality', 'idType', 'idNumber', 'address', 'city', 'primaryPhone'] as const;
    const missingPersonal = requiredPersonalFields.filter((field) => {
      const value = personal[field];
      return typeof value !== 'string' || !value.trim();
    });
    if (missingPersonal.length > 0) {
      return NextResponse.json({ error: `Missing required personal fields: ${missingPersonal.join(', ')}` }, { status: 400 });
    }

    if (!documents || typeof documents !== 'object') {
      return NextResponse.json({ error: 'Missing documents payload.' }, { status: 400 });
    }

    const idDocumentUrl = typeof documents.idDocumentUrl === 'string' ? documents.idDocumentUrl.trim() : '';
    const proofOfAddressUrl = typeof documents.proofOfAddressUrl === 'string' ? documents.proofOfAddressUrl.trim() : '';
    if (!idDocumentUrl || !proofOfAddressUrl) {
      return NextResponse.json({ error: 'Missing required document uploads.' }, { status: 400 });
    }

    const subRef = db.collection('kyc_submissions').doc(uid);
    const existingSubmissionSnap = await subRef.get();
    if (existingSubmissionSnap.exists) {
      const submissionStatus = existingSubmissionSnap.data()?.status;
      if (submissionStatus === 'approved') {
        return NextResponse.json({ error: 'Your KYC submission is already approved.' }, { status: 409 });
      }
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    // Write a submission document; use a deterministic id so re-submits overwrite pending
    await subRef.set({
      user_id: uid,
      full_name: personal.fullName.trim(),
      primary_phone: personal.primaryPhone.trim(),
      id_type: personal.idType.trim(),
      id_number: personal.idNumber.trim(),
      id_front_url: idDocumentUrl,
      // optional back for driver license can be added in UI later
      selfie_url: null,
      proof_of_address_url: proofOfAddressUrl,
      address: personal.address.trim(),
      city: personal.city.trim(),
      state: typeof personal.state === 'string' && personal.state.trim() ? personal.state.trim() : null,
      postal_code: typeof personal.postalCode === 'string' && personal.postalCode.trim() ? personal.postalCode.trim() : null,
      date_of_birth: personal.dateOfBirth.trim(),
      nationality: personal.nationality.trim(),
      status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: null,
      submitted_at: now,
      updated_at: now,
    }, { merge: true });

    // Update user's verification status to pending
    await userRef.set({
      verification_status: 'pending',
      kyc_submitted_at: now,
    }, { merge: true });

    const userEmail: string | undefined = userData.email || decoded.email;
    const userName: string = userData.fullName || userData.full_name || userData.display_name || decoded.name || 'there';

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
  await logActivity({ user_id: uid, action: 'kyc_submitted', entity_type: 'kyc_submission', entity_id: uid, changes: { id_type: personal.idType.trim() } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('KYC submit error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
 
