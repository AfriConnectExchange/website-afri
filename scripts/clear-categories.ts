// scripts/clear-categories.ts
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import path from 'path';
import serviceAccount from '../creds.json' with { type: 'json' };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const db = admin.firestore();

async function clearCategories() {
  const snap = await db.collection('categories').get();
  const batch = db.batch();
  snap.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Deleted ${snap.size} categories.`);
}

clearCategories().catch(err => {
  console.error(err);
  process.exit(1);
});
