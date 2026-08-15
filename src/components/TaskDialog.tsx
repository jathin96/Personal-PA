'use client';

import { useState, useEffect } from 'react';
import type { Task, TaskPriority } from '@/types';

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string; priority: TaskPriority; dueDate?: string }) => void;
  task?: Task | null; // If provided, we're editing
}

export default function TaskDialog({ open, onClose, onSubmit, task }: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      if (task.dueDate) {
        const d = new Date(task.dueDate);
        setDueDate(d.toISOString().split('T')[0]);
        setDueTime(d.toTimeString().slice(0, 5));
      } else {
        setDueDate('');
        setDueTime('');
      }
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate('');
      setDueTime('');
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let dueDateISO: string | undefined;
    if (dueDate) {
      const dateStr = dueTime ? `${dueDate}T${dueTime}:00` : `${dueDate}T00:00:00`;
      dueDateISO = new Date(dateStr).toISOString();
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDateISO,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-zinc-100 mb-6">
            {task ? 'Edit Task' : '✨ New Task'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                autoFocus
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add details..."
                rows={3}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all resize-none"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Priority</label>
              <div className="flex gap-2">
                {(['LOW', 'MEDIUM', 'HIGH'] as TaskPriority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      priority === p
                        ? p === 'HIGH'
                          ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50'
                          : p === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50'
                          : 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50'
                        : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                    }`}
                  >
                    {p === 'HIGH' ? '🔴' : p === 'MEDIUM' ? '🟡' : '🟢'} {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Time</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={e => setDueTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-violet-500/20"
              >
                {task ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
