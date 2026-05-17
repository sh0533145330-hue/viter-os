import Link from 'next/link';
import { readWorkspace, getTomName } from './lib/workspace';
import { getInboxMessages, getPendingApprovals } from './actions/inbox';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function TomHomePage() {
  const w = await readWorkspace();
  const tomName = getTomName(w);

  let entityCount = 0;
  let msgCount = 0;
  const [messages, approvals] = await Promise.all([
    getInboxMessages(5),
    getPendingApprovals(),
  ]);
  msgCount = messages.length;

  if (w.supabase?.url && w.supabase?.serviceRoleKey) {
    const supabase = createClient(w.supabase.url, w.supabase.serviceRoleKey);
    const { count } = await supabase.from('entities').select('id', { count: 'exact', head: true });
    entityCount = count ?? 0;
  }

  const recentAssistant = messages.filter(m => m.role === 'assistant')[0];

  return (
    <>
      <header className='px-5 pt-6 pb-3 flex items-center justify-between'>
        <div>
          <div className='text-xs uppercase tracking-widest text-[var(--tom-text-dim)]'>{tomName}</div>
          <h1 className='text-2xl font-semibold tracking-tight'>{greeting()}</h1>
        </div>
        <Link href='/voice' aria-label='Voice'
          className='h-11 w-11 rounded-full bg-[var(--tom-accent)] flex items-center justify-center shadow-lg'>
          <span aria-hidden className='text-lg'>●</span>
        </Link>
      </header>

      {recentAssistant && (
        <section className='px-5 pb-3'>
          <div className='rounded-2xl bg-[var(--tom-accent-soft)] border border-[var(--tom-accent)]/30 p-4'>
            <div className='text-xs text-[var(--tom-text-dim)] mb-1.5'>{tomName} · latest</div>
            <div className='text-sm leading-relaxed line-clamp-3'>{recentAssistant.content}</div>
            <div className='mt-3 flex gap-2'>
              <Link href='/briefings' className='text-xs px-3 py-1.5 rounded-full bg-[var(--tom-surface-2)] border border-[var(--tom-border)]'>Briefings</Link>
              {approvals.length > 0 && (
                <Link href='/approvals' className='text-xs px-3 py-1.5 rounded-full bg-[var(--tom-accent)] text-white'>Approvals · {approvals.length}</Link>
              )}
            </div>
          </div>
        </section>
      )}

      {entityCount > 0 && (
        <section className='px-5 pb-3'>
          <div className='grid grid-cols-3 gap-2 text-center'>
            <div className='rounded-xl bg-[var(--tom-surface)] border border-[var(--tom-border)] p-3'>
              <div className='text-lg font-semibold'>{entityCount.toLocaleString()}</div>
              <div className='text-[10px] text-[var(--tom-text-dim)]'>entities</div>
            </div>
            <div className='rounded-xl bg-[var(--tom-surface)] border border-[var(--tom-border)] p-3'>
              <div className='text-lg font-semibold'>{msgCount}</div>
              <div className='text-[10px] text-[var(--tom-text-dim)]'>messages</div>
            </div>
            <div className='rounded-xl bg-[var(--tom-surface)] border border-[var(--tom-border)] p-3'>
              <div className={`text-lg font-semibold ${approvals.length > 0 ? 'text-orange-400' : ''}`}>{approvals.length}</div>
              <div className='text-[10px] text-[var(--tom-text-dim)]'>decisions</div>
            </div>
          </div>
        </section>
      )}

      <section className='flex-1 overflow-y-auto px-5 pb-4'>
        <h2 className='text-xs uppercase tracking-widest text-[var(--tom-text-dim)] mb-2'>Recent</h2>
        {messages.length === 0 ? (
          <div className='rounded-xl bg-[var(--tom-surface)] border border-[var(--tom-border)] p-6 text-center'>
            <p className='text-sm text-[var(--tom-text-dim)]'>Ask {tomName} your first question →</p>
            <Link href='/ask' className='text-xs text-[var(--tom-accent)] hover:underline mt-1 inline-block'>Open Ask</Link>
          </div>
        ) : (
          <ul className='space-y-2'>
            {messages.map(m => (
              <li key={m.id} className='rounded-xl bg-[var(--tom-surface)] border border-[var(--tom-border)] p-3'>
                <div className='text-[10px] text-[var(--tom-text-dim)] mb-1'>{m.role === 'user' ? 'You' : tomName}</div>
                <div className='text-sm line-clamp-2'>{m.content}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className='border-t border-[var(--tom-border)] bg-[var(--tom-surface)] flex justify-around py-2'>
        <Link href='/' className='flex flex-col items-center text-xs text-[var(--tom-accent)]'>Home</Link>
        <Link href='/ask' className='flex flex-col items-center text-xs text-[var(--tom-text-dim)]'>Ask</Link>
        <Link href='/voice' className='flex flex-col items-center text-xs text-[var(--tom-text-dim)]'>Voice</Link>
        <Link href='/mind' className='flex flex-col items-center text-xs text-[var(--tom-text-dim)]'>Mind</Link>
        <Link href='/approvals' className='flex flex-col items-center text-xs text-[var(--tom-text-dim)]'>
          Approve{approvals.length > 0 ? ` · ${approvals.length}` : ''}
        </Link>
      </nav>
    </>
  );
}
