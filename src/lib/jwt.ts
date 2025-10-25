import { SignJWT, jwtVerify } from 'jose';

const ALG = 'HS256';

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set in env');
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(payload: { sub: string; sid?: string }, expiresInSeconds = 60 * 15) {
  const secret = getSecretKey();
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .setIssuer('afri')
    .sign(secret);

  return token;
}

export async function verifyAccessToken(token: string) {
  const secret = getSecretKey();
  const { payload } = await jwtVerify(token, secret, { issuer: 'afri' });
  return payload as Record<string, any>;
}

export default { signAccessToken, verifyAccessToken };
