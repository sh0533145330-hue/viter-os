'use client';
import { useState } from 'react';
import { decideApproval } from '../actions/inbox';
import type { PendingApproval } from '../actions/inbox';

export function ApprovalsClient({ initialApprovals, tomName }: { initialApprovals: PendingApproval[]; tomName: string }) {
  const [approvals, setApprovals] = useState(initialApprovals);
  const [deciding, setDeciding] = useState<string | null>(null);

  async function decide(id: string, decision: 'approved' | 'rejected') {
    setDeciding(id);
    await decideApproval(id, decision);
    setApprovals(prev => prev.filter(a => a.id !== id));
    setDeciding(null);
  }

  const riskColor = (risk: string) => {
    if (risk === 'L4') return 'border-red-500/40 bg-red-500/10';
    if (risk === 'L3') return 'border-orange-400/40 bg-orange-400/10';
    return 'border-[var(--tom-border)]';
  };

  if (approvals.length === 0) {
    return (
      <div className='flex-1 flex items-center justify-center text-center px-6'>
        <div>
          <div className='text-4xl mb-3'>✓</div>
          <div className='text-sm font-medium'>All clear</div>
          <p className='text-xs text-[var(--tom-text-dim)] mt-1'>{tomName} has no pending decisions for you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 overflow-y-auto px-4 py-4 space-y-3'>
      {approvals.map(a => (
        <div key={a.id} className={`rounded-xl border p-4 ${riskColor(a.risk)}`}>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-2'>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${a.risk === 'L4' ? 'bg-red-500/20 text-red-400' : a.risk === 'L3' ? 'bg-orange-400/20 text-orange-400' : 'bg-[var(--tom-surface-2)] text-[var(--tom-text-dim)]'}`}>{a.risk}</span>
              <span className='text-xs text-[var(--tom-text-dim)]'>{a.kind}</span>
            </div>
            <span className='text-[10px] text-[var(--tom-text-dim)]'>{new Date(a.createdAt).toLocaleTimeString()}</span>
          </div>
          <p className='text-sm'>{(a.payload['description'] as string | undefined) ?? a.kind}</p>
          <div className='flex gap-2 mt-3'>
            <button onClick={() => decide(a.id, 'approved')} disabled={deciding === a.id}
              className='flex-1 rounded-lg bg-[var(--tom-accent)] text-white text-xs py-2 disabled:opacity-50'>
              Approve
            </button>
            <button onClick={() => decide(a.id, 'rejected')} disabled={deciding === a.id}
              className='flex-1 rounded-lg bg-[var(--tom-surface-2)] border border-[var(--tom-border)] text-xs py-2 disabled:opacity-50'>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
