import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import * as taskService from '@/lib/tasks';
import type { TaskStatus, TaskPriority } from '@/types';

async function authGuard() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const denied = await authGuard();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as TaskStatus | null;
  const priority = searchParams.get('priority') as TaskPriority | null;
  const filterDate = searchParams.get('date');
  const search = searchParams.get('search');

  if (search) {
    const tasks = await taskService.searchTasks(search);
    return NextResponse.json(tasks);
  }

  const tasks = await taskService.listTasks({
    status: status || undefined,
    priority: priority || undefined,
    filterDate: filterDate || undefined,
  });
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const denied = await authGuard();
  if (denied) return denied;

  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    const task = await taskService.createTask({
      title: body.title,
      description: body.description,
      priority: body.priority,
      dueDate: body.dueDate,
    });
    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
