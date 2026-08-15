import { cookies } from 'next/headers';
import { randomBytes, createHash } from 'crypto';

const SESSION_COOKIE = 'pa_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSessionToken(): string {
  const password = process.env.APP_PASSWORD || 'admin';
  return createHash('sha256').update(password + '_pa_session_salt_v1').digest('hex');
}

export async function validatePassword(password: string): Promise<boolean> {
  return password === (process.env.APP_PASSWORD || 'admin');
}

export async function createSession(): Promise<string> {
  const token = getSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  return token;
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session) return false;
  return session.value === getSessionToken();
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
