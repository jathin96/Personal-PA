'use client';

import type { Task } from '@/types';
import TaskCard from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  filter: 'all' | 'today' | 'completed';
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
}

export default function TaskList({ tasks, filter, onComplete, onDelete, onEdit }: TaskListProps) {
  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.status === 'COMPLETED';
    if (filter === 'today') {
      if (task.status !== 'PENDING') return false;
      if (!task.dueDate) return false;
      const today = new Date();
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === today.toDateString();
    }
    return task.status === 'PENDING';
  });

  // Group by overdue / today / upcoming / no date
  const now = new Date();
  const todayStr = now.toDateString();
  
  const overdue = filteredTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && new Date(t.dueDate).toDateString() !== todayStr);
  const today = filteredTasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === todayStr);
  const upcoming = filteredTasks.filter(t => t.dueDate && new Date(t.dueDate) > now && new Date(t.dueDate).toDateString() !== todayStr);
  const noDate = filteredTasks.filter(t => !t.dueDate);

  const sections = [
    { label: '🚨 Overdue', tasks: overdue, show: filter !== 'completed' },
    { label: '📅 Today', tasks: today, show: filter !== 'completed' },
    { label: '🗓️ Upcoming', tasks: upcoming, show: filter !== 'completed' },
    { label: '📌 No Due Date', tasks: noDate, show: filter !== 'completed' },
    { label: '✅ Completed', tasks: filteredTasks, show: filter === 'completed' },
  ].filter(s => s.show && s.tasks.length > 0);

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <p className="text-4xl mb-3">{filter === 'completed' ? '🎯' : '🎉'}</p>
        <p className="text-sm font-medium">
          {filter === 'completed' ? 'No completed tasks yet' : 'All clear! No pending tasks'}
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          {filter !== 'completed' && 'Tap + to add a new task'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {sections.map(section => (
        <div key={section.label}>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">
            {section.label} ({section.tasks.length})
          </h3>
          <div className="space-y-2">
            {section.tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={onComplete}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
