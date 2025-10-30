import admin from 'firebase-admin';

if (!admin.apps.length) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Let the SDK pick up the JSON file via GOOGLE_APPLICATION_CREDENTIALS
    admin.initializeApp();
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Accept a full service account JSON as an environment variable (use Secret Manager to set this safely)
    try {
      const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: svc.project_id,
          clientEmail: svc.client_email,
          privateKey: svc.private_key,
        }),
      });
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON', err);
      throw err;
    }
  } else {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
}

// Enable ignoring undefined properties globally as a safety-net for Firestore writes
try {
  // Some environments may not allow settings to be changed after first access; wrap in try/catch
  const firestore = admin.firestore();
  firestore.settings({ ignoreUndefinedProperties: true });
} catch (err) {
  // Non-fatal: if settings can't be applied, we still sanitize at the write site
  // (activity-logger already removes undefined values).
  // Log at debug level to help during development.
  // eslint-disable-next-line no-console
  // Use a safe string conversion for the error to avoid TS complaints about unknown shape
  console.warn('Could not apply Firestore settings ignoreUndefinedProperties:', (err as any)?.message ?? String(err));
}

export default admin;
