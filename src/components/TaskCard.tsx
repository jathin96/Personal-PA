'use client';

import { useState, useRef } from 'react';
import type { Task } from '@/types';

const priorityConfig = {
  HIGH: { color: 'bg-red-500', text: 'text-red-400', label: 'High', icon: '🔴' },
  MEDIUM: { color: 'bg-amber-500', text: 'text-amber-400', label: 'Medium', icon: '🟡' },
  LOW: { color: 'bg-emerald-500', text: 'text-emerald-400', label: 'Low', icon: '🟢' },
};

interface TaskCardProps {
  task: Task;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
}

export default function TaskCard({ task, onComplete, onDelete, onEdit }: TaskCardProps) {
  const [swiping, setSwiping] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(0);
  const config = priorityConfig[task.priority];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    if (diff > 0) setSwipeX(Math.min(diff, 120));
  };

  const handleTouchEnd = () => {
    if (swipeX > 80) {
      onComplete(task.id);
    }
    setSwipeX(0);
    setSwiping(false);
  };

  const isCompleted = task.status === 'COMPLETED';
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`relative group rounded-xl border transition-all duration-200 overflow-hidden ${
        isCompleted
          ? 'bg-zinc-900/50 border-zinc-800 opacity-60'
          : isOverdue
          ? 'bg-red-950/20 border-red-900/30 hover:border-red-700/50'
          : 'bg-zinc-900/80 border-zinc-800 hover:border-violet-700/50 hover:shadow-lg hover:shadow-violet-500/5'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateX(${swipeX}px)` }}
    >
      {/* Swipe reveal background */}
      {swipeX > 0 && (
        <div className="absolute inset-y-0 left-0 w-24 bg-emerald-600 flex items-center justify-center rounded-l-xl">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      <div className="p-4">
        {/* Header: Priority + ID */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${config.color}`}></span>
            <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
          </div>
          <span className="text-xs text-zinc-600 font-mono">#{task.id}</span>
        </div>

        {/* Title */}
        <h3 className={`font-semibold text-sm mb-1 ${
          isCompleted ? 'line-through text-zinc-500' : 'text-zinc-100'
        }`}>
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{task.description}</p>
        )}

        {/* Footer: Due date + Actions */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isOverdue
                  ? 'bg-red-900/40 text-red-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                📅 {formatDate(task.dueDate)} {formatTime(task.dueDate) !== '12:00 AM' ? `• ${formatTime(task.dueDate)}` : ''}
              </span>
            )}
          </div>

          {/* Action buttons - visible on hover (desktop) */}
          {!isCompleted && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onComplete(task.id)}
                className="p-1.5 rounded-lg hover:bg-emerald-900/40 text-zinc-400 hover:text-emerald-400 transition-colors"
                title="Complete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 rounded-lg hover:bg-violet-900/40 text-zinc-400 hover:text-violet-400 transition-colors"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-1.5 rounded-lg hover:bg-red-900/40 text-zinc-400 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
