import { Heading2, GlassCard, SectionLabel, FadeIn, Badge } from '@/app/_components/ui';
import { getRecentMessages, getWorkspaceInfo } from '@/app/actions/dashboard';
import { getDashboardCounts } from '@/app/actions/dashboard';

export const dynamic = 'force-dynamic';

export default async function BriefingsPage() {
  const [messages, info, counts] = await Promise.all([
    getRecentMessages(),
    getWorkspaceInfo(),
    getDashboardCounts(),
  ]);

  const assistantMessages = messages.filter(m => m.role === 'assistant');

  return (
    <div className='space-y-5'>
      <FadeIn>
        <Heading2>Briefings</Heading2>
        <p className='text-sm text-[var(--v-text-dim)] mt-1'>What {info.tomName} has been telling you.</p>
      </FadeIn>

      {assistantMessages.length === 0 ? (
        <FadeIn delay={100}>
          <GlassCard className='p-8 text-center'>
            <div className='text-3xl mb-3'>☀</div>
            <div className='text-sm font-medium'>No briefings yet</div>
            <p className='text-xs text-[var(--v-text-dim)] mt-2 max-w-sm mx-auto'>
              {counts.entities > 0
                ? `${info.tomName} has ${counts.entities.toLocaleString()} entities to work with. `
                : 'Connect and sync sources first. '}
              <a href='/app/search' className='text-[var(--v-accent)] hover:underline'>Ask {info.tomName} for your first briefing →</a>
            </p>
          </GlassCard>
        </FadeIn>
      ) : (
        <FadeIn delay={100}>
          <SectionLabel>Recent — {assistantMessages.length} messages</SectionLabel>
          <div className='space-y-3'>
            {assistantMessages.map((m, i) => (
              <FadeIn key={m.id} delay={i * 40}>
                <GlassCard className='p-5' hover>
                  <div className='flex items-center gap-2 mb-2'>
                    <div className='w-5 h-5 rounded-full bg-gradient-to-br from-[var(--v-accent)] to-[var(--v-teal)] flex items-center justify-center text-[9px] text-white font-bold shrink-0'>
                      {info.tomName[0]}
                    </div>
                    <span className='text-xs text-[var(--v-text-dim)]'>{new Date(m.createdAt).toLocaleString()}</span>
                    {m.model && <Badge label={m.model.split('/').pop() ?? m.model} />}
                  </div>
                  <p className='text-sm leading-relaxed whitespace-pre-wrap'>{m.content}</p>
                </GlassCard>
              </FadeIn>
            ))}
          </div>
        </FadeIn>
      )}

      <FadeIn delay={200}>
        <GlassCard className='p-4'>
          <div className='text-sm font-medium'>Schedule a briefing</div>
          <p className='text-xs text-[var(--v-text-dim)] mt-1'>
            Daily briefings (06:30) and weekly OKR summaries (Monday 07:00) are configured via the Workflows engine.
            <a href='/app/workflows' className='text-[var(--v-accent)] hover:underline ml-1'>Set up briefing workflow →</a>
          </p>
        </GlassCard>
      </FadeIn>
    </div>
  );
}
