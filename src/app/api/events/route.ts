import { NextRequest } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { taskEvents } from '@/lib/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial keepalive
      controller.enqueue(encoder.encode(': keepalive\n\n'));

      const handler = (event: any) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          // Client disconnected
          taskEvents.removeListener('task_event', handler);
        }
      };

      taskEvents.on('task_event', handler);

      // Keepalive every 30 seconds
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepalive);
          taskEvents.removeListener('task_event', handler);
        }
      }, 30000);

      // Clean up on abort
      request.signal.addEventListener('abort', () => {
        clearInterval(keepalive);
        taskEvents.removeListener('task_event', handler);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
