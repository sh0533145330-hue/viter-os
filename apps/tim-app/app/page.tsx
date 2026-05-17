import Link from 'next/link';
import { readWorkspace, getTimName, getTomName } from './lib/workspace';
import { getTeamStats } from './actions/team';

export const dynamic = 'force-dynamic';

export default async function TimHomePage() {
  const [w, stats] = await Promise.all([readWorkspace(), getTeamStats()]);
  const timName = getTimName(w);
  const tomName = getTomName(w);

  return (
    <>
      <header className='px-5 pt-6 pb-3 flex justify-between'>
        <div>
          <div className='text-xs uppercase tracking-widest text-[var(--tim-text-dim)]'>{timName}</div>
          <h1 className='text-2xl font-semibold tracking-tight'>Team room</h1>
        </div>
        <Link href='/brief' className='text-xs px-3 py-1.5 rounded-full bg-[var(--tim-accent)] text-[var(--tim-bg)] font-medium'>Daily brief</Link>
      </header>

      <section className='px-5 pb-3'>
        <div className='rounded-2xl bg-[var(--tim-accent-soft)] border border-[var(--tim-accent)]/30 p-4'>
          <div className='text-sm leading-relaxed'>
            {stats.entityCount > 0
              ? `${stats.entityCount.toLocaleString()} entities across ${stats.sourceCount} sources. ${stats.pendingApprovals > 0 ? `${stats.pendingApprovals} team approval${stats.pendingApprovals === 1 ? '' : 's'} waiting.` : 'No pending decisions.'}`
              : `${timName} is ready. Connect sources in the operator app first, then ${timName} will coordinate across the team's ${tomName}s.`
            }
          </div>
          <div className='mt-3 flex gap-2 flex-wrap'>
            <Link href='/okrs' className='text-xs px-3 py-1.5 rounded-full bg-[var(--tim-surface-2)] border border-[var(--tim-border)]'>OKRs</Link>
            <Link href='/threads' className='text-xs px-3 py-1.5 rounded-full bg-[var(--tim-surface-2)] border border-[var(--tim-border)]'>Threads</Link>
            {stats.pendingApprovals > 0 && (
              <span className='text-xs px-3 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300'>
                {stats.pendingApprovals} approvals pending
              </span>
            )}
          </div>
        </div>
      </section>

      <section className='flex-1 overflow-y-auto px-5 pb-4 space-y-4'>
        <div>
          <h2 className='text-xs uppercase tracking-widest text-[var(--tim-text-dim)] mb-2'>Workspace</h2>
          <div className='grid grid-cols-2 gap-2'>
            {[
              { label: 'Entities', value: stats.entityCount.toLocaleString() },
              { label: 'Messages', value: stats.messageCount.toLocaleString() },
              { label: 'Sources', value: stats.sourceCount.toLocaleString() },
              { label: 'Approvals', value: stats.pendingApprovals.toString() },
            ].map(s => (
              <div key={s.label} className='rounded-xl bg-[var(--tim-surface)] border border-[var(--tim-border)] p-3'>
                <div className='text-lg font-semibold'>{s.value}</div>
                <div className='text-[10px] text-[var(--tim-text-dim)]'>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className='text-xs uppercase tracking-widest text-[var(--tim-text-dim)] mb-2'>Navigate</h2>
          <div className='space-y-2'>
            {[
              { href: '/okrs', label: 'OKR tracker', desc: 'Team objectives and key results' },
              { href: '/threads', label: 'Threads', desc: 'Cross-team conversations routed by Tim' },
              { href: '/brief', label: 'Daily brief', desc: 'Weekly + daily summaries' },
            ].map(item => (
              <Link key={item.href} href={item.href} className='flex justify-between items-center rounded-xl bg-[var(--tim-surface)] border border-[var(--tim-border)] p-3 hover:border-[var(--tim-accent)]/40 transition-colors'>
                <div>
                  <div className='text-sm font-medium'>{item.label}</div>
                  <div className='text-xs text-[var(--tim-text-dim)]'>{item.desc}</div>
                </div>
                <span className='text-[var(--tim-text-dim)] text-sm'>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <nav className='border-t border-[var(--tim-border)] bg-[var(--tim-surface)] flex justify-around py-2 text-xs'>
        <Link href='/' className='text-[var(--tim-accent)]'>Team</Link>
        <Link href='/okrs' className='text-[var(--tim-text-dim)]'>OKRs</Link>
        <Link href='/threads' className='text-[var(--tim-text-dim)]'>Threads</Link>
        <Link href='/brief' className='text-[var(--tim-text-dim)]'>Brief</Link>
      </nav>
    </>
  );
}
