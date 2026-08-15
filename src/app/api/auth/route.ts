import { NextRequest, NextResponse } from 'next/server';
import { validatePassword, createSession, isAuthenticated, clearSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const valid = await validatePassword(password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    await createSession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET() {
  const authed = await isAuthenticated();
  return NextResponse.json({ authenticated: authed });
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ success: true });
}
