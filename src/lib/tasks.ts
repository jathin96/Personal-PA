import { prisma } from './prisma';
import { taskEvents } from './events';
import type { Task, CreateTaskInput, ListTasksFilter, TaskStatus } from '@/types';

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description || null,
      priority: input.priority || 'MEDIUM',
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });
  const serialized = serializeTask(task);
  taskEvents.emitTaskEvent('task_created', serialized);
  return serialized;
}

export async function listTasks(filter?: ListTasksFilter): Promise<Task[]> {
  const where: any = {};
  if (filter?.status) where.status = filter.status;
  if (filter?.priority) where.priority = filter.priority;
  if (filter?.filterDate) {
    const date = new Date(filter.filterDate);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.dueDate = { gte: start, lte: end };
  }
  
  const tasks = await prisma.task.findMany({
    where,
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' },
      { createdAt: 'desc' },
    ],
  });
  return tasks.map(serializeTask);
}

export async function completeTask(idOrKeyword: string): Promise<Task | null> {
  const task = await findTaskByIdOrKeyword(idOrKeyword);
  if (!task) return null;
  
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });
  const serialized = serializeTask(updated);
  taskEvents.emitTaskEvent('task_updated', serialized);
  return serialized;
}

export async function rescheduleTask(idOrKeyword: string, newDueDate: string): Promise<Task | null> {
  const task = await findTaskByIdOrKeyword(idOrKeyword);
  if (!task) return null;
  
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { dueDate: new Date(newDueDate) },
  });
  const serialized = serializeTask(updated);
  taskEvents.emitTaskEvent('task_updated', serialized);
  return serialized;
}

export async function deleteTask(idOrKeyword: string): Promise<Task | null> {
  const task = await findTaskByIdOrKeyword(idOrKeyword);
  if (!task) return null;
  
  await prisma.task.delete({ where: { id: task.id } });
  const serialized = serializeTask(task);
  taskEvents.emitTaskEvent('task_deleted', { id: task.id });
  return serialized;
}

export async function searchTasks(query: string): Promise<Task[]> {
  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
  return tasks.map(serializeTask);
}

export async function updateTask(id: number, data: Partial<{ title: string; description: string; status: TaskStatus; priority: string; dueDate: string | null }>): Promise<Task | null> {
  try {
    const updateData: any = { ...data };
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }
    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
    });
    const serialized = serializeTask(updated);
    taskEvents.emitTaskEvent('task_updated', serialized);
    return serialized;
  } catch {
    return null;
  }
}

export async function getTaskById(id: number): Promise<Task | null> {
  const task = await prisma.task.findUnique({ where: { id } });
  return task ? serializeTask(task) : null;
}

export async function getTodayBriefing(): Promise<{ today: Task[]; overdue: Task[]; pending: Task[] }> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  
  const [today, overdue, pending] = await Promise.all([
    prisma.task.findMany({
      where: { status: 'PENDING', dueDate: { gte: todayStart, lte: todayEnd } },
      orderBy: { priority: 'desc' },
    }),
    prisma.task.findMany({
      where: { status: 'PENDING', dueDate: { lt: todayStart } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.task.findMany({
      where: { status: 'PENDING', dueDate: null },
      orderBy: { priority: 'desc' },
    }),
  ]);
  
  return {
    today: today.map(serializeTask),
    overdue: overdue.map(serializeTask),
    pending: pending.map(serializeTask),
  };
}

async function findTaskByIdOrKeyword(idOrKeyword: string) {
  // Try numeric ID first
  const id = parseInt(idOrKeyword, 10);
  if (!isNaN(id)) {
    return prisma.task.findUnique({ where: { id } });
  }
  // Fall back to keyword search in pending tasks
  return prisma.task.findFirst({
    where: {
      status: 'PENDING',
      title: { contains: idOrKeyword },
    },
  });
}

function serializeTask(task: any): Task {
  return {
    ...task,
    dueDate: task.dueDate?.toISOString() || null,
    completedAt: task.completedAt?.toISOString() || null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
