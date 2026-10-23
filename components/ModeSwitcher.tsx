'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('nanoware-mode-change', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('nanoware-mode-change', callback); };
}
function readPreference(userId: string): 'user' | 'client' {
  const saved = window.localStorage.getItem(`nanoware-mode:${userId}`);
  return saved === 'user' ? 'user' : 'client';
}

export function ModeSwitcher({ userId, onNavigate }: { userId: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const preferredMode = useSyncExternalStore(subscribe, () => readPreference(userId), () => 'client');
  const activeMode = pathname.startsWith('/workspace') ? 'user' : pathname.startsWith('/client-mode') ? 'client' : preferredMode;

  const selectMode = (mode: 'user' | 'client') => {
    window.localStorage.setItem(`nanoware-mode:${userId}`, mode);
    window.dispatchEvent(new Event('nanoware-mode-change'));
    onNavigate?.();
    router.push(mode === 'user' ? '/workspace' : '/client-mode');
  };

  return (
    <div role="group" aria-label="Application mode" className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm">
      {(['user', 'client'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={activeMode === mode}
          onClick={() => selectMode(mode)}
          className={`relative rounded-full px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent sm:px-4 ${activeMode === mode ? 'bg-brand-secondary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          {mode === 'user' ? 'User Mode' : 'Client Mode'}
        </button>
      ))}
    </div>
  );
}
