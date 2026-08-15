'use client';

import type { Task, TaskStatus } from '@/types';
import TaskCard from './TaskCard';

const columns: { status: TaskStatus; label: string; icon: string; accent: string }[] = [
  { status: 'PENDING', label: 'Pending', icon: '📋', accent: 'border-violet-500/50' },
  { status: 'COMPLETED', label: 'Completed', icon: '✅', accent: 'border-emerald-500/50' },
  { status: 'CANCELLED', label: 'Cancelled', icon: '❌', accent: 'border-zinc-600/50' },
];

interface TaskBoardProps {
  tasks: Task[];
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
}

export default function TaskBoard({ tasks, onComplete, onDelete, onEdit }: TaskBoardProps) {
  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {columns.map(col => {
        const columnTasks = tasks.filter(t => t.status === col.status);
        return (
          <div key={col.status} className="flex flex-col min-h-0">
            {/* Column header */}
            <div className={`flex items-center gap-2 px-3 py-2.5 mb-4 rounded-xl bg-zinc-900/50 border-b-2 ${col.accent}`}>
              <span className="text-base">{col.icon}</span>
              <h2 className="text-sm font-semibold text-zinc-300">{col.label}</h2>
              <span className="ml-auto text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </div>
            
            {/* Column body */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                  <p className="text-sm">No tasks</p>
                </div>
              ) : (
                columnTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onEdit={onEdit}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
