import { Metric, Heading2, GlassCard, SectionLabel, FadeIn, StatusDot } from '@/app/_components/ui';
import { getDashboardCounts, getRecentMessages, getWorkspaceInfo } from '@/app/actions/dashboard';

export const dynamic = 'force-dynamic';

export default async function AppHomePage() {
  const [counts, messages, info] = await Promise.all([getDashboardCounts(), getRecentMessages(), getWorkspaceInfo()]);

  if (!info.onboarded) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <GlassCard className='p-8 text-center max-w-md'>
          <div className='text-lg font-semibold gradient-text'>Complete setup first</div>
          <p className='text-sm text-[var(--v-text-dim)] mt-2'>Connect Supabase and OpenRouter to activate the context engine.</p>
          <a href='/welcome' className='mt-4 inline-block text-sm text-[var(--v-accent)] hover:underline'>Go to setup →</a>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <FadeIn>
        <Heading2>Today</Heading2>
        <p className='text-sm text-[var(--v-text-dim)] mt-1'>{info.name} · {info.tomName} is watching.</p>
      </FadeIn>

      <FadeIn delay={100}>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          <Metric label='Entities' value={counts.entities.toLocaleString()} hint={counts.sources > 0 ? `from ${counts.sources} sources` : 'sync sources to populate'} />
          <Metric label='Pending approvals' value={counts.pendingApprovals.toString()} hint={counts.pendingApprovals > 0 ? 'needs your decision' : 'all clear'} />
          <Metric label='Sources' value={counts.sources.toString()} hint={counts.sources === 0 ? 'add in Sources' : 'connected'} />
          <Metric label='Messages' value={counts.messages.toString()} hint={`with ${info.tomName}`} />
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <GlassCard className='p-5'>
            <SectionLabel>{info.tomName} briefing</SectionLabel>
            {counts.entities === 0 ? (
              <div className='space-y-2 text-sm'>
                <p className='text-[var(--v-text-dim)]'>No context yet. Once you sync sources, {info.tomName} will brief you daily.</p>
                <a href='/app/connectors' className='text-[var(--v-accent)] text-xs hover:underline'>Add a source →</a>
              </div>
            ) : (
              <div className='space-y-2 text-sm'>
                <p className='text-[var(--v-text-dim)]'>{counts.entities.toLocaleString()} entities ingested across {counts.sources} source{counts.sources !== 1 ? 's' : ''}.</p>
                <a href='/app/search' className='text-[var(--v-accent)] text-xs hover:underline'>Ask {info.tomName} anything →</a>
              </div>
            )}
          </GlassCard>

          <GlassCard className='p-5'>
            <SectionLabel>Recent conversation</SectionLabel>
            {messages.length === 0 ? (
              <div className='text-sm text-[var(--v-text-dim)]'>
                No messages yet. <a href='/app/search' className='text-[var(--v-accent)] hover:underline'>Ask {info.tomName} something →</a>
              </div>
            ) : (
              <ul className='space-y-2'>
                {messages.slice(0, 4).map(m => (
                  <li key={m.id} className='text-xs flex gap-2'>
                    <span className={m.role === 'user' ? 'text-[var(--v-accent)]' : 'text-[var(--v-teal)]'}>{m.role === 'user' ? 'You' : info.tomName}</span>
                    <span className='text-[var(--v-text-dim)] truncate'>{m.content.slice(0, 80)}{m.content.length > 80 ? '…' : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      </FadeIn>

      {counts.entities === 0 && (
        <FadeIn delay={300}>
          <GlassCard className='p-5'>
            <SectionLabel>Getting started</SectionLabel>
            <ul className='space-y-2 text-sm'>
              <li className='flex items-center gap-2'>
                <StatusDot status={counts.sources > 0 ? 'ok' : 'off'} />
                <span className={counts.sources > 0 ? '' : 'text-[var(--v-text-dim)]'}>
                  {counts.sources > 0 ? `${counts.sources} source${counts.sources !== 1 ? 's' : ''} connected` : <a href='/app/connectors' className='text-[var(--v-accent)] hover:underline'>Add a source (Nango, REST, or custom)</a>}
                </span>
              </li>
              <li className='flex items-center gap-2'>
                <StatusDot status={counts.entities > 0 ? 'ok' : 'off'} />
                <span className='text-[var(--v-text-dim)]'>Sync to pull entities into your ontology</span>
              </li>
              <li className='flex items-center gap-2'>
                <StatusDot status={counts.messages > 0 ? 'ok' : 'off'} />
                <span className='text-[var(--v-text-dim)]'><a href='/app/search' className='text-[var(--v-accent)] hover:underline'>Ask {info.tomName} a question</a> over your real data</span>
              </li>
            </ul>
          </GlassCard>
        </FadeIn>
      )}
    </div>
  );
}
