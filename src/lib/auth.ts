import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'constella_admin_session';
const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'constella_super_secret_admin_key_32_chars_long'
);

export async function createSessionToken(username: string): Promise<string> {
  return await new SignJWT({ username, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<{ username: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      username: (payload.username as string) || 'admin',
      role: (payload.role as string) || 'admin',
    };
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export function validateCredentials(username?: string, password?: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD || 'constella2026!';
  return username === expectedUser && password === expectedPass;
}

export { SESSION_COOKIE_NAME };
