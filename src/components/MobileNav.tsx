'use client';

interface MobileNavProps {
  active: 'all' | 'today' | 'completed';
  onChange: (tab: 'all' | 'today' | 'completed') => void;
  onNewTask: () => void;
}

export default function MobileNav({ active, onChange, onNewTask }: MobileNavProps) {
  const tabs = [
    { id: 'all' as const, label: 'All', icon: '📋' },
    { id: 'today' as const, label: 'Today', icon: '📅' },
    { id: 'completed' as const, label: 'Done', icon: '✅' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
      <div className="bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/50 px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 relative">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${
                active === tab.id
                  ? 'text-violet-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}

          {/* FAB */}
          <button
            onClick={onNewTask}
            className="absolute -top-6 right-4 w-12 h-12 bg-violet-600 hover:bg-violet-500 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/30 transition-all active:scale-95"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
