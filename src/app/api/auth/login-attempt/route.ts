import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { sendEmail } from '@/lib/email-service';

interface RequestBody {
  email?: string;
  action?: 'precheck' | 'failure' | 'success';
}

const MAX_FAILURES = 5;
const LOCKOUT_MINUTES = 15;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const email = body.email ? normalizeEmail(body.email) : undefined;
    const action = body.action;

    if (!email || !action) {
      return NextResponse.json({ error: 'Missing email or action.' }, { status: 400 });
    }

    const now = admin.firestore.Timestamp.now();
    const attemptsRef = admin.firestore().collection('auth_attempts').doc(email);

    const result = await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(attemptsRef);
      const data = snap.exists ? snap.data() || {} : {};
      const failedCount = typeof data.failed_count === 'number' ? data.failed_count : 0;
      const lockedUntilTs = data.locked_until instanceof admin.firestore.Timestamp ? data.locked_until : null;
      const lockedUntilDate = lockedUntilTs ? lockedUntilTs.toDate() : null;
      const locked = lockedUntilDate ? lockedUntilDate.getTime() > Date.now() : false;

      if (action === 'precheck') {
        if (locked && lockedUntilDate) {
          const remainingMs = lockedUntilDate.getTime() - Date.now();
          return { locked: true, remainingMs };
        }
        return { locked: false };
      }

      if (action === 'success') {
        if (snap.exists) {
          tx.set(attemptsRef, {
            failed_count: 0,
            locked_until: null,
            updated_at: now,
          }, { merge: true });
        }
        return { locked: false, reset: true };
      }

      // action === 'failure'
      if (locked && lockedUntilDate) {
        const remainingMs = lockedUntilDate.getTime() - Date.now();
        return { locked: true, remainingMs };
      }

      const newCount = failedCount + 1;
      let newLockedUntil: admin.firestore.Timestamp | null = null;

      if (newCount >= MAX_FAILURES) {
        newLockedUntil = admin.firestore.Timestamp.fromMillis(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      }

      tx.set(attemptsRef, {
        failed_count: newCount,
        locked_until: newLockedUntil,
        updated_at: now,
      }, { merge: true });

      return {
        locked: !!newLockedUntil,
        failedCount: newCount,
        lockedUntil: newLockedUntil?.toDate() ?? null,
      };
    });

    if (result.locked && body.action === 'failure' && result.lockedUntil) {
      // Send lockout email asynchronously (best effort)
      const subject = 'Too many login attempts on your AfriConnect account';
      const lockedUntil = new Date(result.lockedUntil).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      const text = `Hi there,

We detected multiple failed sign-in attempts on your AfriConnect account. For security, we locked account login until ${lockedUntil}. If this wasn’t you, please reset your password immediately.

— AfriConnect Security`; 
      const html = `
        <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111">
          <h2>We temporarily locked your account</h2>
          <p>We detected multiple failed sign-in attempts and locked your AfriConnect account until <strong>${lockedUntil}</strong>.</p>
          <p>If this wasn’t you, please <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://africonnect-exchange.org'}/auth/forgot-password" style="color:#2563eb">reset your password</a>.</p>
          <p style="color:#6b7280;font-size:12px">This lockout automatically lifts after ${LOCKOUT_MINUTES} minutes.</p>
          <p>— AfriConnect Security</p>
        </div>`;
      sendEmail({ to: email, subject, text, html }).catch((err) => {
        console.warn('Failed to send lockout email', err);
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('login-attempt route error', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
