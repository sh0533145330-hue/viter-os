import { Heading2, GlassCard, SectionLabel, FadeIn, Metric, Badge } from '@/app/_components/ui';
import { readWorkspace } from '@/app/lib/workspace-store';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const w = await readWorkspace();

  return (
    <div className='space-y-6'>
      <FadeIn>
        <Heading2>Billing</Heading2>
        <p className='text-sm text-[var(--v-text-dim)] mt-1'>Usage metering, budget caps, and Stripe Connect for agency billing.</p>
      </FadeIn>

      <FadeIn delay={100}>
        <div className='grid grid-cols-3 gap-3'>
          <Metric label='Current spend' value='$0' hint='no usage yet' />
          <Metric label='Budget cap' value='Unlimited' hint='set a cap in settings' />
          <Metric label='Plan' value='Self-hosted' hint='direct model' />
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <SectionLabel>Billing model</SectionLabel>
        <GlassCard className='p-5 space-y-4'>
          <div className='flex items-start justify-between'>
            <div>
              <div className='text-sm font-medium'>Direct</div>
              <p className='text-xs text-[var(--v-text-dim)] mt-0.5'>You pay your own OpenRouter and Supabase bills. No VitaOS platform fee in self-hosted mode.</p>
            </div>
            <Badge label='active' variant='green' />
          </div>
          <div className='pt-3 border-t border-[var(--v-border)] space-y-2 text-xs text-[var(--v-text-dim)]'>
            <div className='flex justify-between'><span>OpenRouter API key</span><span className={w.openrouter?.apiKey ? 'text-[var(--v-green)]' : 'text-[var(--v-rose)]'}>{w.openrouter?.apiKey ? '✓ configured' : '✗ missing'}</span></div>
            <div className='flex justify-between'><span>Supabase project</span><span className={w.supabase?.url ? 'text-[var(--v-green)]' : 'text-[var(--v-rose)]'}>{w.supabase?.url ? '✓ configured' : '✗ missing'}</span></div>
          </div>
        </GlassCard>
      </FadeIn>

      <FadeIn delay={300}>
        <GlassCard className='p-4'>
          <div className='text-sm font-medium'>Agency / reseller billing</div>
          <p className='text-xs text-[var(--v-text-dim)] mt-1'>
            <code className='text-[var(--v-accent)]'>@vita/billing</code> supports 4 commercial models: direct, reseller, revenue_share, bundled.
            Stripe Connect integration handles connected accounts and revenue splits. Configure via the billing package.
          </p>
          <a href='/platform/sdk' className='text-xs text-[var(--v-accent)] hover:underline mt-2 inline-block'>Billing SDK docs →</a>
        </GlassCard>
      </FadeIn>
    </div>
  );
}
