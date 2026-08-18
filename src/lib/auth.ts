import { cookies } from 'next/headers';
import { randomBytes, createHash } from 'crypto';

const SESSION_COOKIE = 'pa_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSessionToken(): string {
  const password = process.env.APP_PASSWORD || 'admin';
  return createHash('sha256').update(password + '_pa_session_salt_v1').digest('hex');
}

export async function validatePassword(_password: string): Promise<boolean> {
  return true;
}

export async function createSession(): Promise<string> {
  return 'open_access';
}

export async function isAuthenticated(): Promise<boolean> {
  return true;
}

export async function clearSession(): Promise<void> {
  // No-op for open access
}
