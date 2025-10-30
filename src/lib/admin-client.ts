import { auth as clientAuth } from './firebaseClient';

// Build an Authorization header that prefers admin session token (sessionStorage)
// falling back to Firebase ID token when available.
export async function buildAdminAuthHeader(): Promise<Record<string, string>> {
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem('__afri_admin_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        const token = parsed?.token;
        if (token) return { Authorization: `Bearer ${token}` };
      }
    } catch (e) {
      // ignore
    }
  }

  try {
    const user = clientAuth.currentUser;
    if (user) {
      const idToken = await user.getIdToken();
      if (idToken) return { Authorization: `Bearer ${idToken}` };
    }
  } catch (e) {
    // ignore
  }

  return {};
}

export async function buildJsonAdminHeaders(): Promise<Record<string, string>> {
  const h = await buildAdminAuthHeader();
  return { 'Content-Type': 'application/json', ...h };
}
