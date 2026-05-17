import { Heading2, GlassCard, SectionLabel, FadeIn, Badge, CodeBlock } from '@/app/_components/ui';

export const dynamic = 'force-dynamic';

const SEED_PACKS = [
  { name: 'pack-general', version: '1.0.0', objects: ['Person', 'Account', 'Deal', 'Project', 'Conversation', 'Document'], desc: 'Universal objects for any workspace', installed: true },
  { name: 'pack-cpa', version: '0.4.0', objects: ['Client', 'Engagement', 'Workpaper', 'Finding', 'TaxReturn'], desc: 'Accounting and CPA firm operations', installed: false },
  { name: 'pack-property', version: '0.3.0', objects: ['Property', 'Lease', 'Tenant', 'MaintenanceRequest', 'RentRoll'], desc: 'Property management and real estate', installed: false },
  { name: 'pack-asset', version: '0.3.0', objects: ['Asset', 'Portfolio', 'Transaction', 'Valuation', 'Holding', 'Fund'], desc: 'Asset and fund management', installed: false },
  { name: 'pack-revops', version: '0.5.0', objects: ['Lead', 'Opportunity', 'Contact', 'PipelineStage', 'Activity', 'Pipeline'], desc: 'Revenue operations and sales ops', installed: false },
];

export default function LibraryPage() {
  return (
    <div className='space-y-6'>
      <FadeIn>
        <Heading2>Library</Heading2>
        <p className='text-sm text-[var(--v-text-dim)] mt-1'>Ontology packs — domain-specific object types, vocabularies, and action templates. Signed with Ed25519.</p>
      </FadeIn>

      <FadeIn delay={100}>
        <SectionLabel>Available packs</SectionLabel>
        <div className='space-y-2'>
          {SEED_PACKS.map(p => (
            <GlassCard key={p.name} className='p-4' hover>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <code className='text-[var(--v-accent)] text-sm'>{p.name}</code>
                    <Badge label={p.version} />
                    {p.installed && <Badge label='installed' variant='green' />}
                  </div>
                  <p className='text-xs text-[var(--v-text-dim)] mt-1'>{p.desc}</p>
                  <div className='flex flex-wrap gap-1 mt-2'>
                    {p.objects.map(o => (
                      <span key={o} className='text-[10px] px-1.5 py-0.5 rounded bg-[var(--v-surface-2)] text-[var(--v-text-dim)]'>{o}</span>
                    ))}
                  </div>
                </div>
                <div className='shrink-0 text-xs text-[var(--v-text-dim)]'>{p.objects.length} types</div>
              </div>
            </GlassCard>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <GlassCard className='p-4'>
          <div className='text-sm font-medium'>Install or create packs</div>
          <div className='mt-3 space-y-2'>
            <CodeBlock lang='bash' code={`# Install from registry\nvita pack install pack-revops\n\n# Create your own\nvita new pack pack-myindustry\nvita pack publish ./packs/pack-myindustry`} />
          </div>
          <a href='/platform/packs' className='text-xs text-[var(--v-accent)] hover:underline mt-3 inline-block'>Pack SDK docs →</a>
        </GlassCard>
      </FadeIn>
    </div>
  );
}
