import { Heading1, Body, GradientButton, GlassCard, GradientOrb, CodeBlock, Badge } from '@/app/_components/ui';

export default function DonePage() {
  return (
    <div className='animate-fade-up space-y-6 relative text-center'>
      <GradientOrb size={600} />
      <div className='relative z-10 space-y-6'>
        <Heading1 className='text-4xl md:text-5xl'><span className='gradient-text'>You&apos;re live</span></Heading1>
        <Body dim className='max-w-md mx-auto'>Your context engine is connected. Tom is watching. Here&apos;s what to do first.</Body>
        <div className='grid grid-cols-1 gap-3 text-left max-w-md mx-auto'>
          <GlassCard className='p-4' hover>
            <div className='text-sm font-medium'>Sync your sources</div>
            <div className='text-xs text-[var(--v-text-dim)] mt-1'>Go to Sources and hit Sync Now on each connector. Entities will start flowing in.</div>
          </GlassCard>
          <GlassCard className='p-4' hover>
            <div className='text-sm font-medium'>Ask Tom something</div>
            <div className='text-xs text-[var(--v-text-dim)] mt-1'>Hit \u2318K or click Search. Ask &quot;What are my most recent deals?&quot; — Tom will cite sources.</div>
          </GlassCard>
          <GlassCard className='p-4' hover>
            <div className='text-sm font-medium'>Install a pack</div>
            <div className='text-xs text-[var(--v-text-dim)] mt-1'>vita pack install pack-cpa (or any from the Library) to add domain-specific object types.</div>
          </GlassCard>
        </div>
        <div className='pt-4'>
          <a href='/app'><GradientButton variant='primary' className='text-base px-8 py-3 animate-pulse-glow'>Enter VitaOS</GradientButton></a>
        </div>
        <div className='pt-6 text-[10px] text-[var(--v-text-muted)] uppercase tracking-widest'>
          Also available: CLI, MCP, SDK
        </div>
        <div className='flex justify-center gap-3'>
          <Badge label='vita CLI' variant='accent' />
          <Badge label='Tom MCP' variant='teal' />
          <Badge label='Connector SDK' variant='default' />
        </div>
      </div>
    </div>
  );
}
