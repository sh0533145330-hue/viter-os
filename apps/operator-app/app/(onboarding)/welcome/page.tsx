import { GradientOrb, Heading1, Body, GradientButton, GlassCard, FadeIn, Badge } from '@/app/_components/ui';
import { isOnboarded } from '@/app/lib/workspace-store';

export default async function WelcomePage() {
  const alreadyOnboarded = await isOnboarded();

  return (
    <div className='relative animate-fade-up min-h-screen flex flex-col justify-center py-12'>
      <GradientOrb size={600} className='animate-float opacity-20' />

      <div className='relative z-10 space-y-10'>
        {/* Hero */}
        <div className='space-y-4'>
          <FadeIn>
            <div className='text-[10px] uppercase tracking-[0.28em] text-[var(--v-text-muted)] mb-4'>VitaOS · 2026</div>
            <Heading1>
              <span className='gradient-text'>Your 360° context engine.</span>
              <br />
              <span className='text-[var(--v-text-dim)]'>AI that works inside</span>
              <br />
              <span className='gradient-text'>your boundaries.</span>
            </Heading1>
          </FadeIn>
          <FadeIn delay={100}>
            <Body dim className='max-w-sm leading-loose'>
              Connect every tool. Build a live ontology. Let Tom and Tim reason, draft, and act — with you in control at every boundary.
            </Body>
          </FadeIn>
        </div>

        {/* Feature pills */}
        <FadeIn delay={200}>
          <div className='flex flex-wrap gap-2'>
            {['250+ connectors', 'Hybrid RAG', 'L1–L4 autonomy', 'Nango OAuth', 'OpenRouter', 'Tom + Tim MCP', 'Cedar policies', 'pgvector'].map(f => (
              <Badge key={f} label={f} variant='default' />
            ))}
          </div>
        </FadeIn>

        {/* Steps */}
        <FadeIn delay={300}>
          <div className='space-y-2'>
            {[
              { n: '01', title: 'Connect Supabase', desc: 'Your data stays in your Postgres. VitaOS deploys the schema.' },
              { n: '02', title: 'Add OpenRouter', desc: 'One key. Every model. Tom, Tim, embeddings, extraction.' },
              { n: '03', title: 'Connect sources', desc: '250+ OAuth connectors via Nango. Any REST API. Custom SDK.' },
              { n: '04', title: 'Meet Tom', desc: 'Set your autonomy level. Tom starts watching.' },
            ].map(s => (
              <GlassCard key={s.n} className='p-4 flex gap-4 items-start glass-hover transition-v'>
                <span className='text-[var(--v-text-muted)] font-mono text-xs mt-0.5'>{s.n}</span>
                <div>
                  <div className='text-sm font-medium'>{s.title}</div>
                  <div className='text-xs text-[var(--v-text-dim)] mt-0.5'>{s.desc}</div>
                </div>
              </GlassCard>
            ))}
          </div>
        </FadeIn>

        {/* CTA */}
        <FadeIn delay={400}>
          <div className='flex gap-3'>
            {alreadyOnboarded ? (
              <>
                <a href='/app'><GradientButton variant='primary' className='animate-pulse-glow'>Enter VitaOS →</GradientButton></a>
                <a href='/welcome/workspace'><GradientButton variant='secondary'>Re-run setup</GradientButton></a>
              </>
            ) : (
              <>
                <a href='/welcome/workspace'><GradientButton variant='primary'>Get started →</GradientButton></a>
                <a href='/platform/overview'><GradientButton variant='secondary'>See the platform</GradientButton></a>
              </>
            )}
          </div>
        </FadeIn>

        {/* Bottom platform nav */}
        <FadeIn delay={500}>
          <div className='pt-4 border-t border-[var(--v-border-subtle)] flex flex-wrap gap-4 text-xs text-[var(--v-text-muted)]'>
            {['CLI', 'MCP', 'Packs', 'Eval', 'SDK', 'Security'].map(p => (
              <a key={p} href={`/platform/${p.toLowerCase()}`} className='hover:text-[var(--v-text)] transition-v'>{p}</a>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
