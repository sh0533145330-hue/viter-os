import { Heading2, Body, GlassCard, CodeBlock, FadeIn, Badge } from '@/app/_components/ui';

const packs = [
  { name: 'pack-general', desc: 'Core: Person, Account, Deal, Project, Conversation, Document', objects: 6 },
  { name: 'pack-cpa', desc: 'CPA firms: Client, Engagement, Workpaper, Finding, TaxReturn', objects: 5 },
  { name: 'pack-property', desc: 'Property management: Property, Lease, Tenant, Maintenance, RentRoll', objects: 5 },
  { name: 'pack-asset', desc: 'Asset management: Asset, Portfolio, Transaction, Valuation, Holding, Fund', objects: 6 },
  { name: 'pack-revops', desc: 'RevOps: Lead, Opportunity, Contact, Stage, Activity, Pipeline', objects: 6 },
];

export default function PacksPage() {
  return (
    <div className='space-y-10'>
      <FadeIn>
        <Badge label='Packs' variant='accent' />
        <Heading2 className='mt-3'><span className='gradient-text'>Ontology packs</span></Heading2>
        <Body dim className='mt-2'>Domain-specific object types, link types, action types, and vocabularies. Signed with Ed25519, resolved with semver dependency graph.</Body>
      </FadeIn>
      <div className='space-y-3'>
        {packs.map(p => (
          <GlassCard key={p.name} className='p-4' hover>
            <div className='flex justify-between items-start'>
              <div><div className='text-sm font-mono text-[var(--v-accent)]'>{p.name}</div><div className='text-xs text-[var(--v-text-dim)] mt-1'>{p.desc}</div></div>
              <Badge label={`${p.objects} objects`} />
            </div>
          </GlassCard>
        ))}
      </div>
      <FadeIn>
        <CodeBlock lang='bash' code={`$ vita new pack pack-finance\n  created pack.json\n\n$ vita pack publish ./packs/pack-finance\n  (stub) Would sign and publish pack at: ./packs/pack-finance`} />
      </FadeIn>
    </div>
  );
}
