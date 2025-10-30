import admin from './firebaseAdmin';
import crypto from 'crypto';

const SESSIONS_COLLECTION = 'admin_sessions';
const ACCOUNTS_COLLECTION = 'admin_accounts';

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash: derived };
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Verify admin access either via Firebase ID token or admin session token
export async function verifyAdminRequest(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];

  // Try Firebase ID token first
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) return null;
    const data = userDoc.data() as any;
    const roles: string[] = data?.roles || [];
    if (roles.includes('admin') || roles.includes('superadmin')) {
      return { type: 'firebase', uid, roles };
    }
  } catch (err) {
    // not a firebase token or invalid - fall through to session check
  }

  // Check admin session token in Firestore
  try {
    const q = await admin.firestore().collection(SESSIONS_COLLECTION).where('token', '==', token).limit(1).get();
    if (q.empty) return null;
    const doc = q.docs[0];
    const session = doc.data() as any;
    if (!session || !session.username || session.expires_at?.toDate) {
      // check expiry
      const expires = session.expires_at ? session.expires_at.toDate() : null;
      if (expires && expires.getTime() < Date.now()) return null;
    }
    // load account
    const accQ = await admin.firestore().collection(ACCOUNTS_COLLECTION).where('username', '==', session.username).limit(1).get();
    if (accQ.empty) return null;
    const acc = accQ.docs[0].data() as any;
    if (!acc.is_active) return null;
    return { type: 'admin_session', username: session.username, roles: acc.roles || [] };
  } catch (err) {
    return null;
  }
}
