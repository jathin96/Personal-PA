'use client';

import type { Task } from '@/types';

interface DailyBriefingProps {
  tasks: Task[];
}

export default function DailyBriefing({ tasks }: DailyBriefingProps) {
  const now = new Date();
  const todayStr = now.toDateString();
  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const todayTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === todayStr);
  const overdueTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && new Date(t.dueDate).toDateString() !== todayStr);
  const completedToday = tasks.filter(t => t.status === 'COMPLETED' && t.completedAt && new Date(t.completedAt).toDateString() === todayStr);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
      <h2 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
        <span className="text-base">☀️</span> Today&apos;s Focus
      </h2>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-violet-400">{todayTasks.length}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Due Today</p>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{overdueTasks.length}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Overdue</p>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{completedToday.length}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Done</p>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-950/30 border border-red-900/30 rounded-xl p-3 mb-4">
          <p className="text-xs font-medium text-red-400 mb-2">🚨 Overdue</p>
          {overdueTasks.slice(0, 3).map(t => (
            <p key={t.id} className="text-xs text-red-300/70 truncate">• {t.title}</p>
          ))}
          {overdueTasks.length > 3 && (
            <p className="text-xs text-red-500 mt-1">+{overdueTasks.length - 3} more</p>
          )}
        </div>
      )}

      {/* Today's tasks */}
      {todayTasks.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-400 mb-2">📋 Today&apos;s Tasks</p>
          {todayTasks.map(t => {
            const priorityColor = t.priority === 'HIGH' ? 'bg-red-500' : t.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500';
            return (
              <div key={t.id} className="flex items-center gap-2 py-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${priorityColor}`} />
                <span className="text-xs text-zinc-300 truncate flex-1">{t.title}</span>
                {t.dueDate && (
                  <span className="text-[10px] text-zinc-600">
                    {new Date(t.dueDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-zinc-600 text-center py-3">No tasks due today 🎉</p>
      )}

      {/* Total pending */}
      <div className="mt-4 pt-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-500">
          <span className="font-semibold text-zinc-400">{pendingTasks.length}</span> total pending tasks
        </p>
      </div>
    </div>
  );
}
