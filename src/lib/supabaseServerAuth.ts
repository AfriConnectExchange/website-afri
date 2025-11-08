/**
 * Server-side Supabase auth helpers for SSR and API routes.
 *
 * Usage examples:
 *  - In an API route: const user = await getUserFromRequest(req);
 *  - In a server component: const user = await getUserFromRequest(request);
 *
 * This file uses the `createServerSupabase()` factory in `src/lib/supabaseClient.ts`
 * so it requires the SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL env vars to be set
 * for server-side verification.
 */
import { createServerSupabase } from './supabaseClient';

export async function getUserFromAccessToken(accessToken?: string | null) {
  if (!accessToken) return null;
  const supabase = createServerSupabase();
  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error) {
      // In many cases error will be null and data.user populated for valid tokens
      throw error;
    }
    return data?.user ?? null;
  } catch (err) {
    // Keep errors non-fatal for callers — they can treat a null as unauthenticated.
    // eslint-disable-next-line no-console
    console.warn('getUserFromAccessToken error', err);
    return null;
  }
}

/**
 * Extract a Supabase access token from a Request-like object.
 * Priority: Authorization header (Bearer) -> common Supabase cookie names.
 */
export function extractAccessTokenFromRequest(req: { headers?: { get?: (name: string) => string | null }; cookies?: { get?: (name: string) => { value: string } | undefined } } | Request): string | null {
  try {
    // Try Authorization header first
    const headers = (req as Request).headers ?? (req as any).headers;
    if (headers && typeof headers.get === 'function') {
      const auth = headers.get('authorization') ?? headers.get('Authorization');
      if (auth && auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
    }

    // Try cookies: common Supabase cookie keys used when using cookie-based session
    // (these names may vary depending on your setup)
    const cookieHeader = headers?.get ? headers.get('cookie') : undefined;
    if (cookieHeader) {
      const cookieString = cookieHeader as string;
      // common names: sb:token, supabase-auth-token, supabase-access-token
      const match = cookieString.match(/(?:sb:token|supabase-auth-token|supabase-access-token)=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
    }

    // If the request object supports cookies.get (Next.js Request in Edge), try that
    const cookiesGetter = (req as any).cookies?.get;
    if (typeof cookiesGetter === 'function') {
      const c = (req as any).cookies.get('sb:token') || (req as any).cookies.get('supabase-auth-token') || (req as any).cookies.get('supabase-access-token');
      if (c && c.value) return c.value;
    }
  } catch (e) {
    // ignore and return null
  }
  return null;
}

export async function getUserFromRequest(req: Request | any) {
  const token = extractAccessTokenFromRequest(req);
  return getUserFromAccessToken(token);
}

export async function requireUserFromRequest(req: Request | any) {
  const user = await getUserFromRequest(req);
  if (!user) {
    const err: any = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  return user;
}

export default {
  getUserFromAccessToken,
  extractAccessTokenFromRequest,
  getUserFromRequest,
  requireUserFromRequest,
};
