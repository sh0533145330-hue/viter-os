import { Heading1, Heading2, Body, GlassCard, GradientOrb, GradientButton, FadeIn, Badge, CodeBlock } from '@/app/_components/ui';

const capabilities = [
  { title: 'Context engine', desc: 'Ingest from any source. Build a unified ontology. Hybrid search + RAG with citations.', badges: ['Nango', 'REST', 'pgvector'] },
  { title: 'Agent workforce', desc: 'Tom (personal), Tim (team), Deny (guardrail), specialists. Autonomy levels keep you in control.', badges: ['L1–L4', 'Boundaries', 'Approvals'] },
  { title: 'Block engine', desc: '28 built-in blocks. Compose workflows. Runtime with retries, idempotency, budget guards.', badges: ['Blocks', 'Workflows', 'BudgetGuard'] },
  { title: 'Ontology substrate', desc: '6 extractors, EntityLinker, ConflictResolver, LineageScribe, EmbeddingPipeline.', badges: ['L0–L4', 'Lineage', 'Derivations'] },
  { title: 'White-label', desc: 'BrandResolver, AgentRenamer, theme tokens, custom domains, DKIM/SPF/DMARC.', badges: ['Agency', 'Multi-tenant', 'CSS vars'] },
  { title: 'Security', desc: 'PII redaction, k-anonymity, envelope encryption, break-glass, DSR, abuse detection.', badges: ['HIPAA', 'KMS', 'Audit'] },
];

export default function PlatformOverview() {
  return (
    <div className='space-y-16'>
      <div className='relative text-center'>
        <GradientOrb size={600} />
        <div className='relative z-10'>
          <FadeIn>
            <Badge label='Platform' variant='accent' />
            <Heading1 className='mt-4'><span className='gradient-text'>Everything that makes VitaOS extensible</span></Heading1>
            <Body dim className='max-w-2xl mx-auto mt-4'>A context engine, agent workforce, ontology substrate, block engine, white-label layer, and security stack — all composable via CLI, MCP, Packs, SDK, and Eval.</Body>
          </FadeIn>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {capabilities.map((c, i) => (
          <FadeIn key={c.title} delay={i * 80}>
            <GlassCard className='p-5 h-full' hover>
              <Heading2 className='text-lg'>{c.title}</Heading2>
              <Body dim className='mt-2'>{c.desc}</Body>
              <div className='mt-3 flex gap-1.5 flex-wrap'>{c.badges.map(b => <Badge key={b} label={b} />)}</div>
            </GlassCard>
          </FadeIn>
        ))}
      </div>

      <FadeIn>
        <div className='text-center space-y-4'>
          <Heading2>Get started in 60 seconds</Heading2>
          <CodeBlock lang='bash' code={`npx @vita/cli init my-workspace\ncd my-workspace\nvita new block hello-world\nvita doctor`} />
          <a href='/welcome'><GradientButton variant='primary' className='mt-4'>Launch the app</GradientButton></a>
        </div>
      </FadeIn>
    </div>
  );
}
