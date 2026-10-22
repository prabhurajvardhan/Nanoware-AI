'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

type HistoryEntry = { id: string; kind?: string; service?: string; status?: string; startAt?: unknown; createdAt?: unknown; origin?: string };
function dateText(value: unknown) {
  const date = value && typeof value === 'object' && 'seconds' in value ? new Date(Number((value as { seconds: number }).seconds) * 1000) : new Date(String(value || ''));
  return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString();
}

export function CustomerHistoryPanel({ customerId, businessId }: { customerId: string; businessId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const onToggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (history.length || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/workspace/customers/${encodeURIComponent(customerId)}/history?businessId=${encodeURIComponent(businessId)}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to load customer history.');
      setHistory(payload.history || []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load customer history.'); }
    finally { setBusy(false); }
  };
  return <div className="mt-3"><button type="button" aria-expanded={open} onClick={onToggle} className="text-xs font-medium text-brand-accent hover:underline">{open ? 'Hide history' : 'View history'}</button>{open && <div className="mt-2 rounded-lg bg-slate-50 p-3">{busy ? <Loader2 className="h-4 w-4 animate-spin text-brand-accent" /> : error ? <p role="alert" className="text-xs text-red-700">{error}</p> : history.length ? <ol className="space-y-2">{history.map((item) => <li key={item.id} className="text-xs text-slate-600"><strong>{item.kind?.replaceAll('_', ' ') || 'Activity'}</strong>{item.service ? ` · ${item.service}` : ''}{item.status ? ` · ${item.status}` : ''}<span className="block text-slate-400">{dateText(item.startAt || item.createdAt)}</span></li>)}</ol> : <p className="text-xs text-slate-500">No recorded interactions yet.</p>}</div>}</div>;
}
