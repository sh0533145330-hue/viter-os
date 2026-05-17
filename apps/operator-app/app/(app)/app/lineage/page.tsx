import { Heading2, GlassCard, FadeIn, Badge, SectionLabel } from '@/app/_components/ui';
import { listEntities } from '@/app/actions/ontology';
import { getWorkspaceInfo } from '@/app/actions/dashboard';

export const dynamic = 'force-dynamic';

export default async function LineagePage() {
  const [entities, info] = await Promise.all([listEntities({ limit: 20 }), getWorkspaceInfo()]);

  return (
    <div className='space-y-5'>
      <FadeIn>
        <Heading2>Lineage</Heading2>
        <p className='text-sm text-[var(--v-text-dim)] mt-1'>Every fact traces back to a source. Click an entity to inspect its derivation chain.</p>
      </FadeIn>

      {entities.length === 0 ? (
        <FadeIn delay={100}>
          <GlassCard className='p-8 text-center'>
            <div className='text-3xl mb-3'>⋯</div>
            <div className='text-sm font-medium'>No entities yet</div>
            <p className='text-xs text-[var(--v-text-dim)] mt-1'>Sync sources to see the lineage graph.</p>
          </GlassCard>
        </FadeIn>
      ) : (
        <>
          <FadeIn delay={100}>
            <SectionLabel>Recent entities — select to trace lineage</SectionLabel>
            <div className='space-y-1.5'>
              {entities.map((e, i) => (
                <FadeIn key={e.id} delay={i * 30}>
                  <GlassCard className='px-4 py-3' hover>
                    <div className='flex items-center justify-between gap-3'>
                      <div className='flex-1 min-w-0'>
                        <div className='text-sm font-medium truncate'>
                          {e.url
                            ? <a href={e.url} target='_blank' rel='noopener noreferrer' className='hover:text-[var(--v-accent)] transition-v'>{e.title}</a>
                            : e.title}
                        </div>
                        {e.updatedAt && (
                          <div className='text-[10px] text-[var(--v-text-muted)] mt-0.5'>{new Date(e.updatedAt).toLocaleDateString()}</div>
                        )}
                      </div>
                      <div className='flex gap-1.5 shrink-0'>
                        <Badge label={e.sourceKind} />
                        <Badge label={e.type} variant='accent' />
                      </div>
                    </div>
                  </GlassCard>
                </FadeIn>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={300}>
            <GlassCard className='p-4'>
              <div className='text-sm font-medium'>Full lineage graph</div>
              <p className='text-xs text-[var(--v-text-dim)] mt-1'>
                Deep lineage tracing — source records → extraction → conflict resolution → derivation — is available via the <code className='text-[var(--v-accent)]'>@vita/ontology</code> LineageScribe.
                Interactive D3 lineage graph coming in v2 (EP-21).
              </p>
            </GlassCard>
          </FadeIn>
        </>
      )}
    </div>
  );
}
