import admin from 'firebase-admin';

if (!admin.apps.length) {
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Let the SDK pick up the JSON file via GOOGLE_APPLICATION_CREDENTIALS
    admin.initializeApp({
      storageBucket: storageBucket,
    });
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
        storageBucket: storageBucket,
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
      storageBucket: storageBucket,
    });

    // Apply settings only once, during initialization
    try {
      const firestore = admin.firestore();
      firestore.settings({ ignoreUndefinedProperties: true });
      console.log("Firestore settings applied.");
    } catch (err) {
      console.warn('Could not apply Firestore settings on initialization:', (err as any)?.message ?? String(err));
    }
  }
}

export default admin;
