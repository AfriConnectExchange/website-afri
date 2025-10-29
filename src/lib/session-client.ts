import { auth as clientAuth } from '@/lib/firebaseClient';

const DEVICE_KEY = 'afri_device_id';
const SESSION_KEY = 'afri_session_id';

function generateId() {
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      return (crypto as any).randomUUID();
    }
  } catch (e) {
    // ignore
  }
  return 'dev-' + Math.random().toString(36).slice(2, 10);
}

export function getDeviceId() {
  try {
    if (typeof window === 'undefined') return null;
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = generateId();
        localStorage.setItem(DEVICE_KEY, id!);
    }
    return id;
  } catch (e) {
    console.warn('Failed to read/write device id', e);
    return null;
  }
}

async function fetchWithToken(path: string, options: RequestInit = {}) {
  if (!clientAuth.currentUser) throw new Error('Not authenticated');
  const token = await clientAuth.currentUser.getIdToken(true);
  const headers: Record<string,string> = { 'Authorization': `Bearer ${token}` };
  if (options.headers) Object.assign(headers, options.headers as Record<string,string>);
  return fetch(path, { ...options, headers });
}

export async function createSession() {
  try {
    const device_id = getDeviceId();
    const user_agent = typeof navigator !== 'undefined' ? navigator.userAgent : null;
    const res = await fetchWithToken('/api/sessions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id, user_agent })
    });
    const json = await res.json();
    if (res.ok && json.session_id) {
      try { localStorage.setItem(SESSION_KEY, json.session_id); } catch (e) {}
      return json.session_id;
    }
    console.warn('createSession failed', json);
    return null;
  } catch (e) {
    console.error('createSession error', e);
    return null;
  }
}

export async function heartbeatSession() {
  try {
    const session_id = typeof window !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null;
    if (!session_id) return null;
    const res = await fetchWithToken('/api/sessions/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id })
    });
    return await res.json();
  } catch (e) {
    console.error('heartbeatSession error', e);
    return null;
  }
}

export async function revokeSession(sessionId?: string) {
  try {
    const session_id = sessionId ?? (typeof window !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null);
    if (!session_id) return null;
    const res = await fetchWithToken('/api/sessions/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id })
    });
    const json = await res.json();
    if (res.ok) {
      try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    }
    return json;
  } catch (e) {
    console.error('revokeSession error', e);
    return null;
  }
}

export async function listSessions() {
  try {
    const res = await fetchWithToken('/api/sessions/list');
    const json = await res.json();
    if (res.ok) return json.sessions ?? [];
    return [];
  } catch (e) {
    console.error('listSessions error', e);
    return [];
  }
}
