import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { render } from '@react-email/render';
import DeletionRequestEmail from '@/components/emails/deletion-request-template';
import { sendEmail } from '@/lib/email-service';
import { logActivity } from '@/lib/activity-logger';
import { CloudTasksClient } from '@google-cloud/tasks';
import { randomUUID } from 'crypto';

// Cloud Tasks configuration — set via env or defaults
const TASKS_PROJECT = process.env.GCP_PROJECT || process.env.FIREBASE_PROJECT_ID;
const TASKS_LOCATION = process.env.CLOUD_TASKS_LOCATION || 'us-central1';
const TASKS_QUEUE = process.env.CLOUD_TASKS_QUEUE || 'deletion-queue';
const TASKS_SERVICE_ACCOUNT = process.env.TASKS_SERVICE_ACCOUNT_EMAIL || undefined; // optional, used for OIDC
const PERFORM_DELETION_URL = process.env.PERFORM_DELETION_URL || process.env.PERFORM_DELETION_FUNCTION_URL;

const tasksClient = new CloudTasksClient();

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    // Get user email and display name
    const fbUser = await admin.auth().getUser(uid);
    const email = fbUser.email;
    const displayName = fbUser.displayName ?? null;

    const now = new Date();
    const scheduledAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    // Mark user doc with scheduled deletion
    const userDocRef = admin.firestore().collection('users').doc(uid);
    await userDocRef.set({ deletion_requested_at: now.toISOString(), deletion_scheduled_at: scheduledAt, deletion_status: 'scheduled' }, { merge: true });

    // Create a lightweight scheduled request doc so admins / tasks can pick it up
    const reqRef = await admin.firestore().collection('deletion_requests').add({ user_id: uid, scheduled_at: scheduledAt, created_at: now.toISOString(), status: 'scheduled' });

    // Generate one-time token to validate the eventual task payload (defense-in-depth)
    const oneTimeToken = randomUUID();

    // Create Cloud Task to run once after 24 hours
    try {
      if (!TASKS_PROJECT || !TASKS_LOCATION || !TASKS_QUEUE || !PERFORM_DELETION_URL) {
        console.warn('Cloud Tasks not fully configured; skipping task creation. Set CLOUD_TASKS_QUEUE, CLOUD_TASKS_LOCATION and PERFORM_DELETION_URL env vars.');
      } else {
        const parent = tasksClient.queuePath(TASKS_PROJECT, TASKS_LOCATION, TASKS_QUEUE);
        const scheduleTimeSeconds = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

        const payload = { requestId: reqRef.id, uid, token: oneTimeToken };
        const task = {
          httpRequest: {
            httpMethod: 'POST',
            url: PERFORM_DELETION_URL,
            headers: {
              'Content-Type': 'application/json'
            },
            body: Buffer.from(JSON.stringify(payload)).toString('base64'),
            // Use OIDC if a service account is provided so Cloud Functions/Run can verify the caller
            ...(TASKS_SERVICE_ACCOUNT ? { oidcToken: { serviceAccountEmail: TASKS_SERVICE_ACCOUNT } } : {})
          },
          scheduleTime: { seconds: scheduleTimeSeconds }
        };

        const [response] = await tasksClient.createTask({ parent, task });
        const taskName = response.name;
        // Save task name and token on request doc for possible cancellation
        await reqRef.update({ cloud_task_name: taskName, one_time_token: oneTimeToken });
      }
    } catch (taskErr) {
      console.error('Failed to create Cloud Task for deletion request', taskErr);
      // Leave the deletion_requests doc present so the scheduled scanner can still pick it up
    }

    // Render email and send confirmation
    if (email) {
      const html = render(<DeletionRequestEmail userName={displayName ?? undefined} scheduledAt={scheduledAt} />);
      const text = `Your account deletion is scheduled for ${scheduledAt}. If you did not request this, please contact support.`;
      try {
        await sendEmail({ to: email, subject: 'Account deletion scheduled', html, text }, uid);
      } catch (e) {
        console.warn('Failed to send deletion scheduled email', e);
      }
    }

  await logActivity({ user_id: uid, action: 'deletion_requested', changes: { scheduled_at: scheduledAt } });

    return NextResponse.json({ ok: true, scheduled_at: scheduledAt });
  } catch (err: any) {
    console.error('Failed to request deletion:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
