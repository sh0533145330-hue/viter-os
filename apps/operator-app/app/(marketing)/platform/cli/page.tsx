import { Heading2, Body, GlassCard, CodeBlock, FadeIn, Badge } from '@/app/_components/ui';

const commands = [
  { cmd: 'vita new block send-email', desc: 'Scaffold a new block with defineBlock + test' },
  { cmd: 'vita new agent researcher', desc: 'Scaffold a specialist agent with defineAgent' },
  { cmd: 'vita new connector my-tool', desc: 'Scaffold a connector extending NativeApiConnector' },
  { cmd: 'vita new pack pack-cpa', desc: 'Scaffold an ontology pack with pack.json' },
  { cmd: 'vita pack publish ./packs/pack-cpa', desc: 'Sign with Ed25519 and publish to the registry' },
  { cmd: 'vita pack install pack-revops', desc: 'Install a pack from the registry' },
  { cmd: 'vita doctor', desc: 'Print environment health: node version, platform, status' },
];

export default function CliPage() {
  return (
    <div className='space-y-10'>
      <FadeIn>
        <Badge label='CLI' variant='accent' />
        <Heading2 className='mt-3'><span className='gradient-text'>vita CLI</span></Heading2>
        <Body dim className='mt-2'>Scaffold, develop, and publish VitaOS extensions from the terminal. 18 tests, fully typed.</Body>
      </FadeIn>
      <div className='space-y-4'>
        {commands.map((c, i) => (
          <FadeIn key={c.cmd} delay={i * 60}>
            <GlassCard className='p-4' hover>
              <code className='text-[var(--v-accent)] text-sm'>{c.cmd}</code>
              <div className='text-xs text-[var(--v-text-dim)] mt-1'>{c.desc}</div>
            </GlassCard>
          </FadeIn>
        ))}
      </div>
      <FadeIn>
        <CodeBlock lang='bash' code={`$ vita new block send-email\ncreated /src/send-email.ts\ncreated /src/send-email.test.ts\n\n$ vita doctor\nvita doctor\n  node: v20.17.0\n  platform: darwin\n  cwd: /my-workspace\n  status: ok`} />
      </FadeIn>
    </div>
  );
}
