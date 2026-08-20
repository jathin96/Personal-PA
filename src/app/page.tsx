'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Task, TaskPriority } from '@/types';
import Header from '@/components/Header';
import TaskBoard from '@/components/TaskBoard';
import TaskList from '@/components/TaskList';
import TaskCard from '@/components/TaskCard';
import TaskDialog from '@/components/TaskDialog';
import MobileNav from '@/components/MobileNav';
import DailyBriefing from '@/components/DailyBriefing';
import { Toaster, toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mobileTab, setMobileTab] = useState<'all' | 'today' | 'completed'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);

      const res = await fetch(`/api/tasks?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // SSE for real-time sync
  useEffect(() => {
    const es = new EventSource('/api/events');
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'task_created' || parsed.type === 'task_updated') {
          setTasks(prev => {
            const existing = prev.findIndex(t => t.id === parsed.data.id);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = parsed.data;
              return updated;
            }
            return [parsed.data, ...prev];
          });
          if (parsed.type === 'task_created') {
            toast.success(`Task created: ${parsed.data.title}`);
          }
        } else if (parsed.type === 'task_deleted') {
          setTasks(prev => prev.filter(t => t.id !== parsed.data.id));
        }
      } catch {}
    };

    es.onerror = () => {
      // Reconnect on error after 5s
      es.close();
      setTimeout(() => {
        eventSourceRef.current = new EventSource('/api/events');
      }, 5000);
    };

    return () => {
      es.close();
    };
  }, []);

  // Keyboard shortcut: N for new task
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setDialogOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Task actions
  const handleComplete = async (id: number) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(prev => prev.map(t => (t.id === id ? updated : t)));
        toast.success('Task completed!');
      }
    } catch {
      toast.error('Failed to complete task');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== id));
        toast.success('Task deleted');
      }
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDialogSubmit = async (data: { title: string; description?: string; priority: TaskPriority; dueDate?: string }) => {
    try {
      if (editingTask) {
        // Update
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const updated = await res.json();
          setTasks(prev => prev.map(t => (t.id === editingTask.id ? updated : t)));
          toast.success('Task updated!');
        }
      } else {
        // Create
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const created = await res.json();
          setTasks(prev => [created, ...prev]);
          toast.success('Task created!');
        }
      }
    } catch {
      toast.error('Failed to save task');
    }
    setEditingTask(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingTask(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulse">
            <span className="text-white text-sm font-bold">PA</span>
          </div>
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#18181b',
            border: '1px solid #27272a',
            color: '#fafafa',
          },
        }}
      />

      <Header
        search={search}
        onSearchChange={setSearch}
        onNewTask={() => { setEditingTask(null); setDialogOpen(true); }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Desktop layout: Kanban + sidebar */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-6">
          <TaskBoard
            tasks={tasks}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
          <aside className="space-y-6">
            <DailyBriefing tasks={tasks} />
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
              <p className="text-xs text-zinc-500 mb-2">⌨️ Shortcuts</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">New task</span>
                  <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500 font-mono text-[10px]">N</kbd>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile layout: List + bottom nav */}
        <div className="sm:hidden">
          {/* Mobile search */}
          <div className="mb-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                id="mobile-search"
              />
            </div>
          </div>

          <TaskList
            tasks={displayTasks}
            filter={mobileTab}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav
        active={mobileTab}
        onChange={setMobileTab}
        onNewTask={() => { setEditingTask(null); setDialogOpen(true); }}
      />

      {/* Task dialog */}
      <TaskDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        task={editingTask}
      />
    </div>
  );
}
