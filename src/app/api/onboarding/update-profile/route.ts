import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { sendEmail } from '@/lib/email-service';

// Simple welcome email template
function buildWelcomeEmail(name: string | null, email: string) {
  const displayName = name || 'New user';
  return {
    to: email,
    subject: 'Welcome to AfriConnect Exchange',
    text: `Hi ${displayName},\n\nWelcome to AfriConnect Exchange! Your profile is set up. Start exploring products and services.\n\nBest,\nAfriConnect Team`,
    html: `<p>Hi <strong>${displayName}</strong>,</p><p>Welcome to <strong>AfriConnect Exchange</strong>! Your profile is set up. Start exploring products and services.</p><p>Best,<br/>AfriConnect Team</p>`,
  };
}

export async function POST(req: Request) {
  const { id, full_name, phone, address, roles } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'User ID required.' }, { status: 400 });
  }

  // Expect Authorization: Bearer <idToken>
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    if (decoded.uid !== id) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Enforce that the user's email is verified before allowing onboarding updates
    if (!decoded.email_verified) {
      return NextResponse.json({ error: 'Email not verified.' }, { status: 403 });
    }

    // Update Firestore user document
    const updateData: Record<string, any> = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (roles !== undefined) updateData.roles = roles;

    // mark onboarding_completed if present in payload (roles implies onboarding finished)
    if (updateData.roles) {
      updateData.onboarding_completed = true;
      updateData.updated_at = admin.firestore.FieldValue.serverTimestamp();
    }

    await admin.firestore().collection('users').doc(id).set(updateData, { merge: true });

    // Optionally send welcome email if onboarding completed
    try {
      const userRecord = await admin.auth().getUser(id);
      const email = userRecord.email ?? decoded.email ?? null;
      if (email && updateData.onboarding_completed) {
        const mail = buildWelcomeEmail(updateData.full_name ?? null, email);
        await sendEmail(mail, id);
      }
    } catch (e) {
      console.error('welcome email failed', e);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unauthorized.' }, { status: 401 });
  }
}
