import { Heading2, GlassCard, SectionLabel, FadeIn, Badge, CodeBlock } from '@/app/_components/ui';

const BLOCKS = [
  // utility
  { key: 'util.transform', cat: 'Utility', desc: 'Map/filter/reshape data records with a type-safe transform function' },
  { key: 'util.format', cat: 'Utility', desc: 'Format values with templates (dates, numbers, strings)' },
  { key: 'util.log', cat: 'Utility', desc: 'Emit structured log event to the observability stack' },
  { key: 'util.sleep', cat: 'Utility', desc: 'Delay execution — useful for rate limiting and scheduling' },
  { key: 'util.parallel', cat: 'Utility', desc: 'Fan out sub-workflows in parallel, merge results' },
  { key: 'util.foreach', cat: 'Utility', desc: 'Iterate over an array and run a sub-workflow per item' },
  { key: 'util.sub-workflow', cat: 'Utility', desc: 'Invoke a named workflow as a reusable sub-routine' },
  // gate
  { key: 'gate.conditional', cat: 'Gate', desc: 'Branch workflow on a boolean condition or expression' },
  { key: 'gate.approval', cat: 'Gate', desc: 'Block until a human approval decision is recorded' },
  { key: 'gate.autonomy', cat: 'Gate', desc: 'Block if the action exceeds the user\'s configured autonomy level' },
  { key: 'gate.time-window', cat: 'Gate', desc: 'Only proceed during specified time windows (e.g. business hours)' },
  { key: 'gate.policy', cat: 'Gate', desc: 'Evaluate a Cedar policy expression and allow/deny' },
  // entity
  { key: 'entity.create', cat: 'Entity', desc: 'Create a new entity in the ontology with type + fields' },
  { key: 'entity.update', cat: 'Entity', desc: 'Upsert fields on an existing entity by ID' },
  { key: 'entity.delete', cat: 'Entity', desc: 'Soft-delete an entity and record lineage event' },
  { key: 'entity.link', cat: 'Entity', desc: 'Create a typed link between two entities' },
  { key: 'entity.query', cat: 'Entity', desc: 'Query entities by type, field filters, or FTS' },
  { key: 'entity.find-or-create', cat: 'Entity', desc: 'Idempotent upsert — find by natural key or create' },
  { key: 'entity.batch', cat: 'Entity', desc: 'Bulk upsert a list of entities efficiently' },
  // action
  { key: 'action.invoke', cat: 'Action', desc: 'Fire an action type registered in the ontology' },
  { key: 'action.propose', cat: 'Action', desc: 'Propose an action for human review before execution' },
  { key: 'action.await-approval', cat: 'Action', desc: 'Wait for an existing approval record to resolve' },
  // agent
  { key: 'agent.call', cat: 'Agent', desc: 'Invoke a registered agent with typed input' },
  { key: 'agent.route-to-specialist', cat: 'Agent', desc: 'Route to the best-fit specialist based on task' },
  { key: 'agent.run-in-tom-context', cat: 'Agent', desc: 'Run a task scoped to a specific user\'s Tom instance' },
  // source
  { key: 'source.fetch-raw-rows', cat: 'Source', desc: 'Fetch raw L0 records from a connector' },
  { key: 'source.fetch-facts', cat: 'Source', desc: 'Fetch normalised L1 facts' },
  { key: 'source.fetch-entities', cat: 'Source', desc: 'Fetch L2 enriched entities' },
  { key: 'source.fetch-derived', cat: 'Source', desc: 'Fetch L3 derived/synthesised records' },
  { key: 'source.search-query', cat: 'Source', desc: 'Run hybrid FTS + vector search across all entities' },
  { key: 'source.embedding-query', cat: 'Source', desc: 'Pure vector similarity search against embeddings' },
];

const CAT_COLORS = {
  Utility: 'default', Gate: 'amber', Entity: 'teal', Action: 'rose', Agent: 'accent', Source: 'green',
} as const;

export default function BlocksPage() {
  const byCategory = BLOCKS.reduce<Record<string, typeof BLOCKS>>((acc, b) => {
    (acc[b.cat] ??= []).push(b);
    return acc;
  }, {});

  return (
    <div className='space-y-6'>
      <FadeIn>
        <Heading2>Blocks</Heading2>
        <p className='text-sm text-[var(--v-text-dim)] mt-1'>{BLOCKS.length} built-in blocks — compose into workflows in the Engine. All inputs/outputs typed with Zod.</p>
      </FadeIn>

      {Object.entries(byCategory).map(([cat, blocks], i) => (
        <FadeIn key={cat} delay={i * 60}>
          <SectionLabel>{cat} <span className='text-[var(--v-text-muted)]'>({blocks.length})</span></SectionLabel>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
            {blocks.map(b => (
              <GlassCard key={b.key} className='px-4 py-3' hover>
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <code className='text-[var(--v-accent)] text-xs'>{b.key}</code>
                    <p className='text-xs text-[var(--v-text-dim)] mt-0.5'>{b.desc}</p>
                  </div>
                  <Badge label={b.cat} variant={CAT_COLORS[b.cat as keyof typeof CAT_COLORS] ?? 'default'} />
                </div>
              </GlassCard>
            ))}
          </div>
        </FadeIn>
      ))}

      <FadeIn delay={400}>
        <GlassCard className='p-4'>
          <div className='text-sm font-medium'>Build a custom block</div>
          <div className='mt-2'>
            <CodeBlock lang='bash' code={`vita new block my-enrichment\n# creates my-enrichment.ts + my-enrichment.test.ts`} />
          </div>
        </GlassCard>
      </FadeIn>
    </div>
  );
}
