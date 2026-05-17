'use client';
import { useState } from 'react';
import { Heading2, GlassCard, SectionLabel, FadeIn, Badge, GradientButton } from '@/app/_components/ui';

export default function BrandPage() {
  const [tomName, setTomName] = useState('Tom');
  const [timName, setTimName] = useState('Tim');
  const [accent, setAccent] = useState('#7c6aff');
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    // NOTE: White-label writes via @vita/branding BrandResolver — wire to server action in v2
    // For now saves to display only
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className='space-y-6'>
      <FadeIn>
        <Heading2>Brand</Heading2>
        <p className='text-sm text-[var(--v-text-dim)] mt-1'>White-label your VitaOS instance for your clients. Agents, theme, domain, and email.</p>
      </FadeIn>

      <FadeIn delay={100}>
        <SectionLabel>Agent names</SectionLabel>
        <GlassCard className='p-5'>
          <div className='grid grid-cols-2 gap-4'>
            <label className='block'>
              <span className='text-xs text-[var(--v-text-dim)] mb-1.5 block'>Personal co-pilot name</span>
              <input value={tomName} onChange={e => setTomName(e.target.value)}
                className='w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--v-accent)] transition-v' />
            </label>
            <label className='block'>
              <span className='text-xs text-[var(--v-text-dim)] mb-1.5 block'>Team co-pilot name</span>
              <input value={timName} onChange={e => setTimName(e.target.value)}
                className='w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--v-accent)] transition-v' />
            </label>
          </div>
        </GlassCard>
      </FadeIn>

      <FadeIn delay={200}>
        <SectionLabel>Theme</SectionLabel>
        <GlassCard className='p-5'>
          <div className='grid grid-cols-2 gap-4'>
            <label className='block'>
              <span className='text-xs text-[var(--v-text-dim)] mb-1.5 block'>Accent color</span>
              <div className='flex gap-2 items-center'>
                <input type='color' value={accent} onChange={e => setAccent(e.target.value)} className='w-10 h-10 rounded-lg border-0 cursor-pointer' />
                <input value={accent} onChange={e => setAccent(e.target.value)}
                  className='flex-1 bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[var(--v-accent)] transition-v' />
              </div>
            </label>
            <label className='block'>
              <span className='text-xs text-[var(--v-text-dim)] mb-1.5 block'>Logo URL</span>
              <input placeholder='https://your-brand.com/logo.svg'
                className='w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-xl px-4 py-2.5 text-sm placeholder:text-[var(--v-text-muted)] focus:outline-none focus:border-[var(--v-accent)] transition-v' />
            </label>
          </div>
        </GlassCard>
      </FadeIn>

      <FadeIn delay={300}>
        <SectionLabel>Custom domain + email</SectionLabel>
        <GlassCard className='p-5 space-y-3'>
          <label className='block'>
            <span className='text-xs text-[var(--v-text-dim)] mb-1.5 block'>Custom domain</span>
            <input placeholder='ai.your-agency.com'
              className='w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-xl px-4 py-2.5 text-sm placeholder:text-[var(--v-text-muted)] focus:outline-none focus:border-[var(--v-accent)] transition-v' />
          </label>
          <div className='text-xs text-[var(--v-text-dim)] flex gap-4'>
            <span><Badge label='DKIM' /> auto-configured via @vita/branding</span>
            <span><Badge label='SPF' /> auto-configured</span>
            <span><Badge label='DMARC' /> auto-configured</span>
          </div>
        </GlassCard>
      </FadeIn>

      <FadeIn delay={400}>
        <GradientButton variant='primary' onClick={handleSave}>
          {saved ? '✓ Saved' : 'Save brand settings'}
        </GradientButton>
        <p className='text-[10px] text-[var(--v-text-muted)] mt-2'>NOTE: Full white-label writes via @vita/branding BrandResolver — multi-tenant config in v2</p>
      </FadeIn>
    </div>
  );
}
