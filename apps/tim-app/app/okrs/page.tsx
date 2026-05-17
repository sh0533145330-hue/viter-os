import Link from 'next/link';
import { readWorkspace, getTimName } from '../lib/workspace';
import { getOKRs } from '../actions/team';

export const dynamic = 'force-dynamic';

function statusColor(s: string) {
  if (s === 'on_track') return 'text-[var(--tim-accent)]';
  if (s === 'at_risk') return 'text-amber-300';
  return 'text-red-400';
}

export default async function OKRsPage() {
  const [w, okrs] = await Promise.all([readWorkspace(), getOKRs()]);
  const timName = getTimName(w);
  return (
    <>
      <header className='px-5 pt-6 pb-3 border-b border-[var(--tim-border)]'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl font-semibold tracking-tight'>OKRs</h1>
          <Link href='/' className='text-xs text-[var(--tim-text-dim)]'>← Back</Link>
        </div>
        <p className='text-xs text-[var(--tim-text-dim)] mt-0.5'>{okrs.length} objectives tracked by {timName}</p>
      </header>
      <div className='flex-1 overflow-y-auto px-4 py-4 space-y-3'>
        {okrs.length === 0 ? (
          <div className='text-center py-12 text-sm text-[var(--tim-text-dim)]'>
            <div className='text-3xl mb-3'>◎</div>
            <p>No OKRs found.</p>
            <p className='text-xs mt-1'>Add entities of type "okr" via the operator app.</p>
          </div>
        ) : (
          okrs.map(o => (
            <div key={o.id} className='rounded-xl bg-[var(--tim-surface)] border border-[var(--tim-border)] p-4'>
              <div className='flex items-start justify-between gap-2 mb-2'>
                <div className='text-sm font-medium'>{o.title}</div>
                <span className={`text-[10px] font-medium ${statusColor(o.status)}`}>{o.status.replace('_', ' ')}</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='flex-1 h-1.5 rounded-full bg-[var(--tim-border)]'>
                  <div className='h-full rounded-full bg-[var(--tim-accent)] transition-all' style={{ width: `${o.progress}%` }} />
                </div>
                <span className='text-[10px] text-[var(--tim-text-dim)]'>{o.progress}%</span>
              </div>
              {o.owner && <div className='text-[10px] text-[var(--tim-text-dim)] mt-1.5'>Owner: {o.owner}</div>}
            </div>
          ))
        )}
      </div>
    </>
  );
}
