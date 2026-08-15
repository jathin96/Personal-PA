import { NextRequest, NextResponse } from 'next/server';
import { webhookCallback } from 'grammy';
import { getBot } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const bot = getBot();
    const handler = webhookCallback(bot, 'std/http');
    return handler(request);
  } catch (error: any) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

// Endpoint to set webhook URL
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Provide ?url=https://...' }, { status: 400 });
  }
  
  try {
    const bot = getBot();
    await bot.api.setWebhook(`${url}/api/telegram`);
    return NextResponse.json({ success: true, webhook: `${url}/api/telegram` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
