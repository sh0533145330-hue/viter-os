import { Heading2, Body, GlassCard, CodeBlock, FadeIn, Badge } from '@/app/_components/ui';

const sdks = [
  { pkg: '@vita/core', desc: 'defineBlock, WorkflowRunner, BudgetGuard, EnginePolicy, SkillRegistry' },
  { pkg: '@vita/agents', desc: 'defineAgent, AgentRuntime, AutonomyResolver, TrainingPair' },
  { pkg: '@vita/connector-sdk', desc: '6 tier base classes: NativeApi, NangoOAuth, Scraper, VoiceChannel, MCPClient, FileEmail' },
  { pkg: '@vita/pack-sdk', desc: 'Ed25519 signing, semver deps, overlay merge, VocabularyResolver' },
  { pkg: '@vita/ontology', desc: 'ExtractionFramework, EntityLinker, ConflictResolver, LineageScribe, SearchIndexer' },
  { pkg: '@vita/integrations', desc: 'Supabase admin, OpenRouter client, NangoClient, GenericRestConnector, RAG pipeline' },
];

export default function SdkPage() {
  return (
    <div className='space-y-10'>
      <FadeIn>
        <Badge label='SDK' variant='accent' />
        <Heading2 className='mt-3'><span className='gradient-text'>TypeScript SDK packages</span></Heading2>
        <Body dim className='mt-2'>Every capability is a typed, tested, importable package. Build blocks, agents, connectors, and packs against stable interfaces.</Body>
      </FadeIn>
      <div className='space-y-3'>
        {sdks.map(s => (
          <GlassCard key={s.pkg} className='p-4' hover>
            <code className='text-[var(--v-accent)] text-sm'>{s.pkg}</code>
            <div className='text-xs text-[var(--v-text-dim)] mt-1'>{s.desc}</div>
          </GlassCard>
        ))}
      </div>
      <FadeIn>
        <CodeBlock lang='typescript' code={`import { defineBlock } from '@vita/core';
import { z } from 'zod';

export const enrichLeadBlock = defineBlock({
  id: 'crm.enrich-lead',
  version: '1.0.0',
  description: 'Enrich a CRM lead with public data',
  input: z.object({ leadId: z.string() }),
  output: z.object({ enriched: z.boolean() }),
  async run(input, ctx) {
    // your logic here
    return { enriched: true };
  },
});`} />
      </FadeIn>
    </div>
  );
}
