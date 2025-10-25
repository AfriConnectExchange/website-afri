import { getServerSession as nextGetServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from './prisma';

/**
 * Helper to reliably resolve the current authenticated user & NextAuth session
 * within server routes. Tries next-auth's getServerSession first and falls
 * back to reading the NextAuth session token cookie and looking up the
 * session row in Prisma. Returns null when no session found.
 */
export async function getServerAuthSession(req?: Request) {
  try {
    // Try next-auth helper first (works when request context is available)
    const sess = await nextGetServerSession(authOptions as any);
    if (sess && (sess as any).user && (sess as any).user.id) {
      // attempt to find NextAuth session row in DB by user and expiry
      const dbSession = await prisma.session.findFirst({ where: { userId: (sess as any).user.id }, orderBy: { expires: 'desc' } });
      return {
        userId: (sess as any).user.id,
        sessionId: dbSession?.id ?? null,
        sessionToken: dbSession?.sessionToken ?? null,
        expires: dbSession?.expires ?? null,
      };
    }
  } catch (err) {
    // ignore and try fallback
  }

  // Fallback: if a Request is provided we can read cookies and find the
  // session via the Prisma `sessions` table using the session token cookie.
  if (req) {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach((c) => {
      const [k, ...v] = c.split('=');
      if (!k) return;
      cookies[k.trim()] = decodeURIComponent((v || []).join('=').trim());
    });

    // Try known NextAuth cookie names first, then a best-effort scan for any
    // cookie name that looks like a NextAuth session token.
    const knownNames = ['__Secure-next-auth.session-token', '__Host-next-auth.session-token', 'next-auth.session-token', 'next-auth.token'];
    let token: string | null = null;
    for (const name of knownNames) {
      if (cookies[name]) {
        token = cookies[name];
        break;
      }
    }

    if (!token) {
      // Fallback: find any cookie key that contains 'next' and 'session' or 'session-token'
      for (const k of Object.keys(cookies)) {
        const kn = k.toLowerCase();
        if (kn.includes('next') && (kn.includes('session') || kn.includes('session-token') || kn.includes('auth'))) {
          token = cookies[k];
          break;
        }
      }
    }

    if (token) {
      const dbSession = await prisma.session.findUnique({ where: { sessionToken: token } });
      if (dbSession) {
        return {
          userId: dbSession.userId,
          sessionId: dbSession.id,
          sessionToken: dbSession.sessionToken,
          expires: dbSession.expires,
        };
      }
    }
  }

  return null;
}

export default getServerAuthSession;
