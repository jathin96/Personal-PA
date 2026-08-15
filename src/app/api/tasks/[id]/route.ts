import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import * as taskService from '@/lib/tasks';

async function authGuard() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await authGuard();
  if (denied) return denied;

  const { id } = await params;
  const task = await taskService.getTaskById(parseInt(id, 10));
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  return NextResponse.json(task);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await authGuard();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const task = await taskService.updateTask(parseInt(id, 10), body);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  return NextResponse.json(task);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await authGuard();
  if (denied) return denied;

  const { id } = await params;
  const task = await taskService.deleteTask(id);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, deletedTask: task });
}
