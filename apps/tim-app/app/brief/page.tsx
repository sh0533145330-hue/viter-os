import Link from 'next/link';
import { readWorkspace, getTimName, getTomName } from '../lib/workspace';
import { getTeamStats } from '../actions/team';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

async function getRecentBriefings(w: { supabase?: { url: string; serviceRoleKey: string } }, limit = 10) {
  if (!w.supabase?.url || !w.supabase?.serviceRoleKey) return [];
  const supabase = createClient(w.supabase.url, w.supabase.serviceRoleKey);
  const { data } = await supabase.from('messages').select('id, content, model, created_at').eq('role', 'assistant').order('created_at', { ascending: false }).limit(limit);
  return (data ?? []) as Array<{ id: string; content: string; model: string | null; created_at: string }>;
}

export default async function BriefPage() {
  const [w, stats] = await Promise.all([readWorkspace(), getTeamStats()]);
  const timName = getTimName(w);
  const tomName = getTomName(w);
  const briefings = await getRecentBriefings(w);
  return (
    <>
      <header className='px-5 pt-6 pb-3 border-b border-[var(--tim-border)]'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl font-semibold tracking-tight'>Team brief</h1>
          <Link href='/' className='text-xs text-[var(--tim-text-dim)]'>← Back</Link>
        </div>
        <p className='text-xs text-[var(--tim-text-dim)] mt-0.5'>{timName} synthesises all team {tomName}s.</p>
      </header>
      <div className='flex-1 overflow-y-auto px-4 py-4 space-y-3'>
        <div className='rounded-xl bg-[var(--tim-surface-2)] border border-[var(--tim-border)] p-4'>
          <div className='text-xs text-[var(--tim-text-dim)] mb-2'>Workspace snapshot</div>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <div><span className='font-semibold'>{stats.entityCount.toLocaleString()}</span> entities</div>
            <div><span className='font-semibold'>{stats.sourceCount}</span> sources</div>
            <div><span className='font-semibold'>{stats.messageCount}</span> messages</div>
            <div><span className={`font-semibold ${stats.pendingApprovals > 0 ? 'text-amber-300' : ''}`}>{stats.pendingApprovals}</span> approvals</div>
          </div>
        </div>
        {briefings.length === 0 ? (
          <div className='text-center py-8 text-sm text-[var(--tim-text-dim)]'>
            <p>No briefings yet. Use the operator app Ask page to generate briefings.</p>
          </div>
        ) : (
          briefings.map(b => (
            <div key={b.id} className='rounded-xl bg-[var(--tim-accent-soft)] border border-[var(--tim-accent)]/30 p-4'>
              <div className='text-[10px] text-[var(--tim-text-dim)] mb-2'>{new Date(b.created_at).toLocaleString()}</div>
              <p className='text-sm leading-relaxed whitespace-pre-wrap'>{b.content}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}
