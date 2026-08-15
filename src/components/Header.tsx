'use client';

import { useState } from 'react';
import type { TaskPriority } from '@/types';

interface HeaderProps {
  search: string;
  onSearchChange: (val: string) => void;
  priorityFilter: TaskPriority | 'ALL';
  onPriorityChange: (val: TaskPriority | 'ALL') => void;
  onNewTask: () => void;
  onLogout: () => void;
}

export default function Header({ search, onSearchChange, priorityFilter, onPriorityChange, onNewTask, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">PA</span>
            </div>
            <h1 className="text-lg font-bold text-zinc-100 hidden sm:block">PA Assistant</h1>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-4 hidden sm:block">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Priority filter */}
            <select
              value={priorityFilter}
              onChange={e => onPriorityChange(e.target.value as TaskPriority | 'ALL')}
              className="hidden sm:block px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50 appearance-none cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">🔴 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">🟢 Low</option>
            </select>

            {/* New task button */}
            <button
              onClick={onNewTask}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-violet-500/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-all"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
