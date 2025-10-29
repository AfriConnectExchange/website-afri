import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { logActivity } from '@/lib/activity-logger';
import { sendEmail } from '@/lib/email-service';
import { render } from '@react-email/render';
import { WelcomeEmail } from '@/components/emails/welcome-template';

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }
  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

  const body = await req.json();
  const { fullName, phone, address, city, postcode, country, avatarUrl, email } = body || {};

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const userDocRef = admin.firestore().collection('users').doc(userId);
    // Sanitize values: Firestore does not accept `undefined` as field values.
    const profileUpdateData = {
      full_name: fullName ?? null,
      email: email ?? null,
      phone: phone ?? null,
      address: address ?? null,
      city: city ?? null,
      postcode: postcode ?? null,
      country: country ?? null,
      profile_picture_url: avatarUrl ?? null,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    // Use .set with { merge: true } to create or update fields
    await userDocRef.set(profileUpdateData, { merge: true });

    // Log the successful profile completion
    await logActivity({
      user_id: userId,
      action: 'onboarding_completed',
      entity_type: 'user',
      entity_id: userId,
      changes: profileUpdateData
    });
    
    // Create a welcome notification in-app
    await admin.firestore().collection('notifications').add({
        user_id: userId,
        type: 'system',
        title: 'Welcome to AfriConnect Exchange!',
        message: 'Your profile has been successfully set up. Start exploring the marketplace now!',
        read: false,
        created_at: new Date().toISOString()
    });

    // If the authenticated Firebase user doesn't have an email (phone sign-ups),
    // and the user provided one during onboarding, update the Auth user via the Admin SDK
    // and send a combined welcome + verification email. If the Auth user already
    // has an email, send the welcome template and log the send.
    try {
      if (!userEmail && email) {
        // Update Firebase Auth user record with provided email
        let updated = false;
        try {
          await admin.auth().updateUser(userId, { email });
          updated = true;
        } catch (updateErr: any) {
          console.error('Failed to update Firebase Auth user email:', updateErr);
          const isEmailInUse = updateErr?.code === 'auth/email-already-exists' || String(updateErr?.message || '').toLowerCase().includes('already exists');
          if (isEmailInUse) {
            try {
              await admin.firestore().collection('notifications').add({
                user_id: userId,
                type: 'system',
                title: 'Email update failed',
                message: 'The email you provided is already associated with another account. Please choose a different email or contact support.',
                read: false,
                created_at: new Date().toISOString(),
                priority: 'high'
              });

              await logActivity({
                user_id: userId,
                action: 'update_user_failed_email_in_use',
                entity_type: 'user',
                entity_id: userId,
                changes: { attempted_email: email }
              });
            } catch (notifErr) {
              console.warn('Failed to create notification or log for email-in-use during onboarding:', notifErr);
            }
          }
        }

        // Generate a verification link and send a branded welcome email including the link
        try {
          const verificationLink = await admin.auth().generateEmailVerificationLink(email);
          const emailHtml = render(<WelcomeEmail userName={fullName ?? 'there'} />);
          const resp = await sendEmail({
            to: email,
            subject: 'Welcome to AfriConnect Exchange!',
            text: `Hi ${fullName || 'there'},\n\nWelcome to AfriConnect Exchange! Please verify your email using the link we sent to you.\n\n${verificationLink}\n\nThanks,\nAfriConnect Team`,
            html: emailHtml,
          }, userId);

          try {
            await logActivity({
              user_id: userId,
              action: 'welcome_email_sent',
              entity_type: 'email',
              entity_id: email,
              changes: { resend_response: resp ?? null }
            });
          } catch (lae) {
            console.warn('Failed to log welcome_email_sent activity:', lae);
          }
        } catch (linkErr) {
          console.error('Failed to generate/send welcome email during onboarding:', linkErr);
        }
      } else if (userEmail) {
        // If user already has an email in Auth, send the welcome template and log the send
        try {
          const emailHtml = render(<WelcomeEmail userName={fullName ?? 'there'} />);
          const resp = await sendEmail({
            to: userEmail,
            subject: 'Welcome to AfriConnect Exchange!',
            text: `Hi ${fullName || 'there'},\n\nWelcome to AfriConnect Exchange! Your profile is now complete. We're excited to have you as part of our community.\n\nHappy exploring!\n\nThe AfriConnect Team`,
            html: emailHtml,
          }, userId);

          try {
            await logActivity({
              user_id: userId,
              action: 'welcome_email_sent',
              entity_type: 'email',
              entity_id: userEmail,
              changes: { resend_response: resp ?? null }
            });
          } catch (lae) {
            console.warn('Failed to log welcome_email_sent activity:', lae);
          }
        } catch (sendErr) {
          console.error('Failed to send welcome email:', sendErr);
        }
      }
    } catch (e) {
      console.error('Email handling errors during onboarding completion:', e);
    }

    return NextResponse.json({ success: true, message: 'Profile completed successfully.' });

  } catch (error: any) {
    console.error('Onboarding completion failed:', error);
    let message = 'Failed to complete onboarding.';
    if (error.code === 'auth/id-token-expired') {
        message = 'Your session has expired. Please sign in again.';
    }
    return NextResponse.json({ error: message, details: error.message }, { status: 500 });
  }
}
