import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

// Remove undefined values recursively so Firestore accepts the write
function sanitizeForFirestore<T>(input: T): T {
  if (input === null || typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map((v) => sanitizeForFirestore(v)) as unknown as T;
  const out: any = {};
  for (const [k, v] of Object.entries(input as any)) {
    if (v === undefined) continue;
    if (v === null) {
      out[k] = null;
      continue;
    }
    out[k] = typeof v === 'object' ? sanitizeForFirestore(v) : v;
  }
  return out as T;
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }
  const token = authHeader.split('Bearer ')[1];

  try {
  const decoded = await admin.auth().verifyIdToken(token);
  const userId = decoded.uid;
  const currentAuthEmail = decoded.email || null;
  const currentAuthPhone = (decoded as any).phone_number || null;

    const body = await req.json();
    const { fullName, email, phone, address, city, postcode, country, latitude, longitude, place_id, formatted_address, avatarUrl, shopName, ownerName, ownerPhone, roles } = body || {};

    // If an email is provided and it's different from the existing auth email,
    // ensure it does not belong to another user. If it belongs to another user,
    // reject the update to avoid silent failures later.
    if (email && String(email).trim()) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (currentAuthEmail && currentAuthEmail.toLowerCase() === normalizedEmail) {
        // same email as auth record — ok
      } else {
        // Check blocked_emails collection first (defensive): if the email is explicitly
        // blocked, refuse the update immediately and log the attempt.
        try {
          const blockedDoc = await admin.firestore().collection('blocked_emails').doc(normalizedEmail).get();
          if (blockedDoc.exists) {
            try {
              await admin.firestore().collection('audit_logs').add({
                type: 'email_blocked_attempt',
                user_id: userId,
                attempted_email: normalizedEmail,
                timestamp: new Date().toISOString(),
                details: { reason: 'blocked_email_list' }
              });
            } catch (logErr) {
              console.warn('Failed to write audit log for blocked email attempt:', logErr);
            }
            return NextResponse.json({ error: 'This email address is not allowed.' }, { status: 400 });
          }
        } catch (blkErr) {
          console.warn('Failed to check blocked_emails collection:', blkErr);
          // Continue to other checks — don't block the request on audit read errors
        }

        // Check if another Firebase Auth user has this email
        try {
          const userRecord = await admin.auth().getUserByEmail(normalizedEmail);
          if (userRecord && userRecord.uid !== userId) {
            try {
              await admin.firestore().collection('audit_logs').add({
                type: 'email_conflict',
                user_id: userId,
                attempted_email: normalizedEmail,
                existing_uid: userRecord.uid,
                timestamp: new Date().toISOString(),
                details: { reason: 'email_in_use' }
              });
            } catch (logErr) {
              console.warn('Failed to write audit log for email conflict:', logErr);
            }
            return NextResponse.json({ error: 'Email already in use by another account.' }, { status: 400 });
          }
          // If userRecord.uid === userId it means the email belongs to this user — ok
        } catch (err: any) {
          const code = err?.code || '';
          // If the user isn't found, getUserByEmail throws; that's ok — proceed
          if (!(code === 'auth/user-not-found' || /no user record/.test(err?.message || ''))) {
            console.error('Error checking email ownership:', err);
            return NextResponse.json({ error: 'Failed to validate email.' }, { status: 500 });
          }
        }
      }
    }

    // Phone uniqueness checks (defensive): normalize and verify the provided phone
    // does not belong to another account and isn't blocked.
    let normalizedPhone: string | null = null;
    if (phone && String(phone).trim()) {
      normalizedPhone = String(phone).trim().replace(/[\s()\-]/g, '');
      try {
        // Check blocked_phones collection first
        const blockedPhoneDoc = await admin.firestore().collection('blocked_phones').doc(normalizedPhone).get();
        if (blockedPhoneDoc.exists) {
          try {
            await admin.firestore().collection('audit_logs').add({
              type: 'phone_blocked_attempt',
              user_id: userId,
              attempted_phone: normalizedPhone,
              timestamp: new Date().toISOString(),
              details: { reason: 'blocked_phone_list' }
            });
          } catch (logErr) {
            console.warn('Failed to write audit log for blocked phone attempt:', logErr);
          }
          return NextResponse.json({ error: 'This phone number is not allowed.' }, { status: 400 });
        }
      } catch (blkErr) {
        console.warn('Failed to check blocked_phones collection:', blkErr);
      }

      if (currentAuthPhone && currentAuthPhone === normalizedPhone) {
        // same phone as auth record — ok
      } else {
        try {
          const phoneUser = await admin.auth().getUserByPhoneNumber(normalizedPhone);
          if (phoneUser && phoneUser.uid !== userId) {
            try {
              await admin.firestore().collection('audit_logs').add({
                type: 'phone_conflict',
                user_id: userId,
                attempted_phone: normalizedPhone,
                existing_uid: phoneUser.uid,
                timestamp: new Date().toISOString(),
                details: { reason: 'phone_in_use' }
              });
            } catch (logErr) {
              console.warn('Failed to write audit log for phone conflict:', logErr);
            }
            return NextResponse.json({ error: 'Phone number already in use by another account.' }, { status: 400 });
          }
        } catch (err: any) {
          const code = err?.code || '';
          if (!(code === 'auth/user-not-found' || /no user record/.test(err?.message || ''))) {
            console.error('Error checking phone ownership:', err);
            return NextResponse.json({ error: 'Failed to validate phone number.' }, { status: 500 });
          }
        }
      }
    }

    // If the auth user has no email and the client provided one, attempt to set it
    // on the Firebase Auth record. If the update fails due to the email being in use,
    // return an error to the client.
    try {
      if (!currentAuthEmail && email && String(email).trim()) {
        try {
          await admin.auth().updateUser(userId, { email: String(email).trim().toLowerCase() });
        } catch (updateErr: any) {
          const isEmailInUse = updateErr?.code === 'auth/email-already-exists' || String(updateErr?.message || '').toLowerCase().includes('already exists');
          if (isEmailInUse) {
            return NextResponse.json({ error: 'Email already in use by another account.' }, { status: 400 });
          }
          console.error('Failed to update auth user email during onboarding update:', updateErr);
        }
      }
    } catch (e) {
      console.warn('Non-fatal error during auth email update attempt', e);
    }

    // If the auth user has no phone and the client provided one, attempt to set it
    // on the Firebase Auth record. If the update fails due to the phone being in use,
    // return an error to the client.
    try {
      if (!currentAuthPhone && normalizedPhone) {
        try {
          await admin.auth().updateUser(userId, { phoneNumber: normalizedPhone });
        } catch (updateErr: any) {
          const isPhoneInUse = updateErr?.code === 'auth/phone-number-already-exists' || String(updateErr?.message || '').toLowerCase().includes('already exists');
          if (isPhoneInUse) {
            try {
              await admin.firestore().collection('audit_logs').add({
                type: 'phone_update_failed_in_use',
                user_id: userId,
                attempted_phone: normalizedPhone,
                timestamp: new Date().toISOString(),
              });
            } catch (logErr) {
              console.warn('Failed to write audit log for phone update failure:', logErr);
            }
            return NextResponse.json({ error: 'Phone number already in use by another account.' }, { status: 400 });
          }
          console.error('Failed to update auth user phone during onboarding update:', updateErr);
        }
      }
    } catch (e) {
      console.warn('Non-fatal error during auth phone update attempt', e);
    }

    // Build profile update data and write to Firestore
    const userDocRef = admin.firestore().collection('users').doc(userId);
    const profileUpdateData: Record<string, any> = {
      full_name: fullName ?? null,
      email: email ?? null,
      phone: normalizedPhone ?? (phone ?? null),
      address: address ?? null,
      city: city ?? null,
      postcode: postcode ?? null,
      country: country ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      place_id: place_id ?? null,
      formatted_address: formatted_address ?? null,
      profile_picture_url: avatarUrl ?? null,
      shop_name: shopName ?? null,
      owner_name: ownerName ?? null,
      owner_phone: ownerPhone ?? null,
      roles: roles ?? undefined,
      updated_at: new Date().toISOString(),
    };

    // Add GeoPoint if lat/lng provided
    if (profileUpdateData.latitude !== null && profileUpdateData.longitude !== null && profileUpdateData.latitude !== undefined && profileUpdateData.longitude !== undefined) {
      try {
        profileUpdateData.location = new admin.firestore.GeoPoint(Number(profileUpdateData.latitude), Number(profileUpdateData.longitude));
      } catch (e) {
        console.warn('Failed to create GeoPoint:', e);
      }
    }

    const sanitized = sanitizeForFirestore(profileUpdateData);
    await userDocRef.set(sanitized, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('onboarding update-profile error:', err);
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}
