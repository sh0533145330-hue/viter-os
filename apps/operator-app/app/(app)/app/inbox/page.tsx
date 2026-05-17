import { Heading2, GlassCard, SectionLabel, FadeIn, Badge } from '@/app/_components/ui';
import { getRecentMessages, getWorkspaceInfo } from '@/app/actions/dashboard';
import { listPendingApprovals } from '@/app/actions/approvals';

export const dynamic = 'force-dynamic';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default async function InboxPage() {
  const [messages, approvals, info] = await Promise.all([
    getRecentMessages(),
    listPendingApprovals(),
    getWorkspaceInfo(),
  ]);

  const total = messages.length + approvals.length;

  return (
    <div className='space-y-5'>
      <FadeIn>
        <div className='flex items-center justify-between'>
          <div>
            <Heading2>Inbox</Heading2>
            <p className='text-sm text-[var(--v-text-dim)] mt-1'>Messages from {info.tomName} and pending decisions.</p>
          </div>
          {total > 0 && <Badge label={`${total} items`} variant='accent' />}
        </div>
      </FadeIn>

      {approvals.length > 0 && (
        <FadeIn delay={100}>
          <SectionLabel>Needs your decision</SectionLabel>
          <div className='space-y-2'>
            {approvals.map(a => (
              <GlassCard key={a.id} className='p-4' hover>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <div className='flex items-center gap-2'>
                      <Badge label={`risk ${a.risk}`} variant={a.risk === 'L3' || a.risk === 'L4' ? 'amber' : 'default'} />
                      <span className='text-sm'>{a.payload?.description as string ?? a.kind}</span>
                    </div>
                    <div className='text-xs text-[var(--v-text-muted)] mt-0.5'>{a.proposer} · {relativeTime(a.createdAt)}</div>
                  </div>
                  <a href='/app/approvals' className='text-xs text-[var(--v-accent)] hover:underline'>Review →</a>
                </div>
              </GlassCard>
            ))}
          </div>
        </FadeIn>
      )}

      {messages.length > 0 && (
        <FadeIn delay={200}>
          <SectionLabel>Recent messages</SectionLabel>
          <div className='space-y-2'>
            {messages.map(m => (
              <GlassCard key={m.id} className='p-4' hover>
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <Badge label={m.role === 'user' ? 'You' : info.tomName} variant={m.role === 'user' ? 'default' : 'accent'} />
                      <span className='text-[10px] text-[var(--v-text-muted)]'>{relativeTime(m.createdAt)}</span>
                    </div>
                    <p className='text-sm text-[var(--v-text-dim)] truncate'>{m.content.slice(0, 120)}{m.content.length > 120 ? '…' : ''}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </FadeIn>
      )}

      {total === 0 && (
        <FadeIn delay={100}>
          <GlassCard className='p-8 text-center'>
            <div className='text-3xl mb-3'>📭</div>
            <div className='text-sm font-medium'>Inbox empty</div>
            <p className='text-xs text-[var(--v-text-dim)] mt-1'>
              <a href='/app/search' className='text-[var(--v-accent)] hover:underline'>Start a conversation with {info.tomName} →</a>
            </p>
          </GlassCard>
        </FadeIn>
      )}
    </div>
  );
}
