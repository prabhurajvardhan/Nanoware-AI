'use client';

import { useEffect, useState } from 'react';

export default function VerificationQueue() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/business-verifications', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to load verification queue.');
      setReviews(Array.isArray(payload.reviews) ? payload.reviews : []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load verification queue.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function decide(review: any, action: 'approve' | 'reject' | 'request-more-info') {
    const reason = window.prompt(action === 'approve' ? 'Enter an approval note:' : 'Enter the reason or information requested:');
    if (!reason || reason.trim().length < 3) return;
    const allowFreeEmail = review.checks?.businessEmailAccepted !== true && action === 'approve'
      ? window.confirm('This business uses a free-mail domain. Explicitly allow it?')
      : false;
    setWorking(review.id); setError('');
    try {
      const response = await fetch(`/api/admin/business-verifications/${encodeURIComponent(review.id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, reason, allowFreeEmail }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to update verification.');
      setReviews((current) => current.filter((item) => item.id !== review.id));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update verification.'); }
    finally { setWorking(''); }
  }

  return <section className="mt-12"><div className="flex items-end justify-between border-b border-slate-200 pb-4"><div><p className="text-sm font-medium text-brand-accent">Phase 1</p><h2 className="font-heading text-2xl font-medium">Business verification queue</h2></div><button onClick={() => void load()} className="text-sm text-brand-accent hover:underline">Refresh</button></div>{error && <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">{error}</div>}{loading ? <div className="py-10 text-slate-500">Loading verification queue…</div> : reviews.length === 0 ? <div className="py-10 text-slate-500">No businesses are waiting for review.</div> : <div className="mt-6 grid gap-5">{reviews.map((review) => <article key={review.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-heading text-xl">{review.tradeName}</h3><p className="text-sm text-slate-500">{review.legalName} · {review.country} · {review.businessType}</p></div><span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700">{review.verificationStatus}</span></div><dl className="grid gap-4 md:grid-cols-3 mt-5 text-sm"><div><dt className="text-slate-400">Business email</dt><dd className="font-medium break-all">{review.businessEmail}</dd></div><div><dt className="text-slate-400">Registration</dt><dd className="font-medium">{review.registrationType}: {review.registrationNumber}</dd></div><div><dt className="text-slate-400">Website proof</dt><dd className="font-medium">{review.websiteProof?.status || 'not provided'}{review.websiteProof?.method ? ` (${review.websiteProof.method})` : ''}</dd></div></dl><p className="mt-4 text-sm text-slate-600 whitespace-pre-wrap">{review.expectedUse}</p><div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4"><button disabled={working === review.id} onClick={() => void decide(review, 'approve')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">Approve</button><button disabled={working === review.id} onClick={() => void decide(review, 'request-more-info')} className="border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">Request more info</button><button disabled={working === review.id} onClick={() => void decide(review, 'reject')} className="border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">Reject</button></div></article>)}</div>}</section>;
}
