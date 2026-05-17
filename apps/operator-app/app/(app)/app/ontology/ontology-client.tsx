'use client';
import { useState, useTransition } from 'react';
import { Heading2, GlassCard, GradientButton, Badge, FadeIn, SectionLabel } from '@/app/_components/ui';
import { listEntities } from '@/app/actions/ontology';
import type { EntityTypeStat, EntityRow } from '@/app/actions/ontology';

export function OntologyClient({ initialStats, initialEntities, onboarded }: {
  initialStats: EntityTypeStat[];
  initialEntities: EntityRow[];
  onboarded: boolean;
}) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [entities, setEntities] = useState(initialEntities);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  function filter(type: string | null, source: string | null, q: string) {
    setSelectedType(type);
    setSelectedSource(source);
    setSearch(q);
    startTransition(async () => {
      const opts: Parameters<typeof listEntities>[0] = { limit: 50 };
      if (type) opts.type = type;
      if (source) opts.sourceKind = source;
      if (q) opts.search = q;
      setEntities(await listEntities(opts));
    });
  }

  const totalEntities = initialStats.reduce((s, r) => s + r.count, 0);
  const totalEmbedded = initialStats.reduce((s, r) => s + r.embedded, 0);
  const uniqueTypes = [...new Set(initialStats.map(s => s.type))];
  const uniqueSources = [...new Set(initialStats.map(s => s.sourceKind))];

  return (
    <div className='space-y-5'>
      <FadeIn>
        <div className='flex items-center justify-between'>
          <div>
            <Heading2>Ontology</Heading2>
            <p className='text-sm text-[var(--v-text-dim)] mt-1'>
              {totalEntities > 0
                ? `${totalEntities.toLocaleString()} entities · ${totalEmbedded.toLocaleString()} embedded`
                : 'Entity graph — sync sources to populate'}
            </p>
          </div>
          {totalEntities > 0 && (
            <div className='flex gap-2 text-xs text-[var(--v-text-dim)]'>
              <span>{uniqueTypes.length} types</span>
              <span>·</span>
              <span>{uniqueSources.length} sources</span>
            </div>
          )}
        </div>
      </FadeIn>

      {!onboarded && (
        <GlassCard className='p-6 text-center'>
          <p className='text-sm text-[var(--v-text-dim)]'>Complete setup to see your ontology.</p>
          <a href='/welcome' className='text-xs text-[var(--v-accent)] hover:underline mt-1 inline-block'>Go to setup →</a>
        </GlassCard>
      )}

      {onboarded && totalEntities === 0 && (
        <FadeIn delay={100}>
          <GlassCard className='p-10 text-center'>
            <div className='text-3xl mb-3'>⬡</div>
            <div className='text-sm font-medium'>No entities yet</div>
            <p className='text-xs text-[var(--v-text-dim)] mt-1'>
              Add a source and sync to populate your ontology. Or <a href='/app/library' className='text-[var(--v-accent)] hover:underline'>install a pack</a> to add object type definitions.
            </p>
          </GlassCard>
        </FadeIn>
      )}

      {onboarded && totalEntities > 0 && (
        <>
          <FadeIn delay={100}>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              {initialStats.slice(0, 8).map(s => (
                <button key={`${s.type}||${s.sourceKind}`}
                  onClick={() => filter(selectedType === s.type ? null : s.type, selectedSource === s.sourceKind ? null : s.sourceKind, search)}
                  className='text-left'>
                  <GlassCard className={`p-3 transition-v ${selectedType === s.type ? 'gradient-border' : ''}`} hover>
                    <div className='text-xs font-medium'>{s.type}</div>
                    <div className='text-[10px] text-[var(--v-text-muted)] mt-0.5'>{s.sourceKind}</div>
                    <div className='mt-2 flex items-end justify-between'>
                      <span className='text-lg font-semibold tracking-tight'>{s.count.toLocaleString()}</span>
                      {s.embedded > 0 && <span className='text-[10px] text-[var(--v-teal)]'>{Math.round(s.embedded / s.count * 100)}% ⃝</span>}
                    </div>
                  </GlassCard>
                </button>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <div className='flex gap-2'>
              <input
                value={search}
                onChange={e => filter(selectedType, selectedSource, e.target.value)}
                placeholder='Search by title…'
                className='flex-1 bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-xl px-4 py-2 text-sm placeholder:text-[var(--v-text-muted)] focus:outline-none focus:border-[var(--v-accent)] transition-v'
              />
              {(selectedType || selectedSource || search) && (
                <GradientButton variant='ghost' onClick={() => filter(null, null, '')}>Clear</GradientButton>
              )}
            </div>
          </FadeIn>

          <FadeIn delay={300}>
            <SectionLabel>
              {isPending ? 'Loading…' : `${entities.length} entities${selectedType ? ` · type: ${selectedType}` : ''}${selectedSource ? ` · source: ${selectedSource}` : ''}`}
            </SectionLabel>
            <div className='space-y-1.5'>
              {entities.map(e => (
                <GlassCard key={e.id} className='px-4 py-3' hover>
                  <div className='flex items-center justify-between gap-3'>
                    <div className='flex-1 min-w-0'>
                      <div className='text-sm font-medium truncate'>
                        {e.url ? <a href={e.url} target='_blank' rel='noopener noreferrer' className='hover:text-[var(--v-accent)] transition-v'>{e.title}</a> : e.title}
                      </div>
                      {e.updatedAt && <div className='text-[10px] text-[var(--v-text-muted)] mt-0.5'>{new Date(e.updatedAt).toLocaleDateString()}</div>}
                    </div>
                    <div className='flex gap-1.5 shrink-0'>
                      <Badge label={e.sourceKind} />
                      <Badge label={e.type} variant='accent' />
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </FadeIn>
        </>
      )}
    </div>
  );
}
