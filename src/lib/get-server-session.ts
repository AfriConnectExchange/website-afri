import { prisma } from './prisma';
import crypto from 'crypto';

/**
 * Helper to reliably resolve the current authenticated user & NextAuth session
 * within server routes. Tries next-auth's getServerSession first and falls
 * back to reading the NextAuth session token cookie and looking up the
 * session row in Prisma. Returns null when no session found.
 */
export async function getServerAuthSession(req?: Request) {
  // NOTE: NextAuth removed — this helper will attempt to locate a session
  // by reading cookies from the provided Request (if any) and looking up
  // the session in the `sessions` table created by Prisma/your auth flow.

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
      // Try legacy NextAuth `sessions` table first
      const dbSession = await prisma.session.findUnique({ where: { sessionToken: token } });
      if (dbSession) {
        return {
          // backward-compatible top-level userId
          userId: dbSession.userId,
          // also provide a `user` object like NextAuth's session
          user: { id: dbSession.userId },
          sessionId: dbSession.id,
          sessionToken: dbSession.sessionToken,
          expires: dbSession.expires,
        } as any;
      }

      // Also try the richer `user_sessions` table. The app stores tokens
      // unhashed in `sessionToken` or a hashed variant in `sessionTokenHash`.
      const userSession = await prisma.userSession.findUnique({ where: { sessionToken: token } }).catch(() => null);
      if (userSession) {
        return {
          userId: userSession.userId,
          user: { id: userSession.userId },
          sessionId: userSession.id,
          sessionToken: userSession.sessionToken ?? null,
          expires: userSession.expiresAt,
        } as any;
      }

      // If token wasn't found as-is, try hashing and looking up by hash.
      try {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const hashedSession = await prisma.userSession.findFirst({ where: { sessionTokenHash: tokenHash } }).catch(() => null);
        if (hashedSession) {
          return {
            userId: hashedSession.userId,
            user: { id: hashedSession.userId },
            sessionId: hashedSession.id,
            sessionToken: null,
            expires: hashedSession.expiresAt,
          } as any;
        }
      } catch (err) {
        // ignore hashing errors
      }
    }
  }

  return null;
}

export default getServerAuthSession;
