import { Heading2, GlassCard, SectionLabel, FadeIn, Badge, CodeBlock } from '@/app/_components/ui';

export const dynamic = 'force-dynamic';

const EXAMPLE_WORKFLOWS = [
  {
    name: 'Daily Tom briefing',
    desc: 'Runs at 06:30 — searches recent entities, generates summary, routes to inbox',
    blocks: ['source.search-query', 'agent.call', 'util.format', 'action.invoke'],
    status: 'template',
  },
  {
    name: 'New lead enrichment',
    desc: 'Triggered by CRM webhook — fetches entity, enriches via search, updates record',
    blocks: ['source.l1-fetch', 'agent.call', 'gate.autonomy', 'entity.update'],
    status: 'template',
  },
  {
    name: 'Customer health check',
    desc: 'Weekly — queries all accounts, flags churn risk, creates inbox items',
    blocks: ['entity.query', 'util.foreach', 'agent.call', 'gate.conditional', 'action.propose'],
    status: 'template',
  },
];

export default function WorkflowsPage() {
  return (
    <div className='space-y-6'>
      <FadeIn>
        <Heading2>Workflows</Heading2>
        <p className='text-sm text-[var(--v-text-dim)] mt-1'>Compose blocks into automated pipelines. Runtime handles retries, idempotency, and budget guards.</p>
      </FadeIn>

      <FadeIn delay={100}>
        <SectionLabel>Template workflows</SectionLabel>
        <div className='space-y-2'>
          {EXAMPLE_WORKFLOWS.map(w => (
            <GlassCard key={w.name} className='p-4' hover>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <div className='text-sm font-medium'>{w.name}</div>
                    <Badge label={w.status} variant='default' />
                  </div>
                  <p className='text-xs text-[var(--v-text-dim)] mt-1'>{w.desc}</p>
                  <div className='flex flex-wrap gap-1 mt-2'>
                    {w.blocks.map(b => (
                      <code key={b} className='text-[10px] px-1.5 py-0.5 rounded bg-[var(--v-surface-2)] text-[var(--v-accent)]'>{b}</code>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <GlassCard className='p-4'>
          <div className='text-sm font-medium'>Workflow engine</div>
          <p className='text-xs text-[var(--v-text-dim)] mt-1 mb-3'>
            Workflows are defined with <code className='text-[var(--v-accent)]'>@vita/core</code> WorkflowRunner — topological sort, retry/backoff, idempotency keys, BudgetGuard. Visual editor coming in v2.
          </p>
          <CodeBlock lang='typescript' code={`import { runWorkflow } from '@vita/core';\n\nawait runWorkflow({\n  id: 'daily-briefing',\n  steps: [\n    { key: 'source.search-query', input: { query: 'recent updates' } },\n    { key: 'agent.call', input: { agentId: 'tom' }, dependsOn: ['search'] },\n  ],\n}, { resolveBlock: resolveBuiltinBlock });`} />
        </GlassCard>
      </FadeIn>
    </div>
  );
}
