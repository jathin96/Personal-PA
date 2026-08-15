export type TaskStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface ListTasksFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  filterDate?: string; // ISO date string
}

export interface SSEEvent {
  type: 'task_created' | 'task_updated' | 'task_deleted';
  data: Task | { id: number };
}
