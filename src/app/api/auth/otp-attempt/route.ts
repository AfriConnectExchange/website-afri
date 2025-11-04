import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

interface RequestBody {
  phone?: string;
  action?: 'precheck' | 'record' | 'reset';
}

const WINDOW_MINUTES = 30;
const MAX_REQUESTS = 5;
const COOLDOWN_MINUTES = 60;

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const phone = body.phone ? normalizePhone(body.phone) : undefined;
    const action = body.action;

    if (!phone || !action) {
      return NextResponse.json({ error: 'Missing phone or action.' }, { status: 400 });
    }

    const now = admin.firestore.Timestamp.now();
    const nowMs = Date.now();
    const windowStartMs = nowMs - WINDOW_MINUTES * 60 * 1000;
    const attemptsRef = admin.firestore().collection('otp_attempts').doc(phone);

    const result = await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(attemptsRef);
      const data = snap.exists ? snap.data() || {} : {};
      const history: admin.firestore.Timestamp[] = Array.isArray(data.request_history)
        ? data.request_history.filter((ts: any) => ts instanceof admin.firestore.Timestamp)
        : [];
      const filteredHistory = history.filter((ts) => ts.toMillis() >= windowStartMs);
      const blockedUntilTs = data.blocked_until instanceof admin.firestore.Timestamp ? data.blocked_until : null;
      const blockedUntilDate = blockedUntilTs ? blockedUntilTs.toDate() : null;
      const isBlocked = blockedUntilDate ? blockedUntilDate.getTime() > nowMs : false;

      if (action === 'precheck') {
        if (isBlocked && blockedUntilDate) {
          return { blocked: true, remainingMs: blockedUntilDate.getTime() - nowMs };
        }
        if (filteredHistory.length >= MAX_REQUESTS) {
          const resetAt = admin.firestore.Timestamp.fromMillis(nowMs + COOLDOWN_MINUTES * 60 * 1000);
          tx.set(attemptsRef, {
            blocked_until: resetAt,
            request_history: filteredHistory,
            updated_at: now,
          }, { merge: true });
          return { blocked: true, remainingMs: COOLDOWN_MINUTES * 60 * 1000 };
        }
        return { blocked: false, remaining: MAX_REQUESTS - filteredHistory.length };
      }

      if (action === 'reset') {
        if (snap.exists) {
          tx.set(attemptsRef, {
            blocked_until: null,
            request_history: [],
            updated_at: now,
          }, { merge: true });
        }
        return { blocked: false, reset: true };
      }

      // action === 'record'
      if (isBlocked && blockedUntilDate) {
        return { blocked: true, remainingMs: blockedUntilDate.getTime() - nowMs };
      }

      const updatedHistory = [...filteredHistory, now];
      let blockedUntil: admin.firestore.Timestamp | null = null;
      if (updatedHistory.length >= MAX_REQUESTS) {
        blockedUntil = admin.firestore.Timestamp.fromMillis(nowMs + COOLDOWN_MINUTES * 60 * 1000);
      }

      tx.set(attemptsRef, {
        request_history: updatedHistory,
        blocked_until: blockedUntil,
        updated_at: now,
      }, { merge: true });

      return {
        blocked: !!blockedUntil,
        blockedUntil: blockedUntil?.toDate() ?? null,
        remaining: Math.max(0, MAX_REQUESTS - updatedHistory.length),
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('otp-attempt route error', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
