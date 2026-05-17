'use client';
import { useState } from 'react';
import { Heading2, Body, GradientButton, GlassCard, Badge } from '@/app/_components/ui';
import { testAndSaveNango } from '@/app/actions/onboarding';
import { NANGO_PROVIDER_REGISTRY, type NangoProviderMeta } from '@vita/integrations/nango';

const allProviders = (Object.values(NANGO_PROVIDER_REGISTRY) as NangoProviderMeta[]);
const byCategory = allProviders.reduce<Record<string, NangoProviderMeta[]>>((acc, p) => {
  (acc[p.category] ??= []).push(p);
  return acc;
}, {});
const CATEGORY_LABELS: Record<string, string> = {
  comms: 'Communication', crm: 'CRM', productivity: 'Productivity',
  dev: 'Development', finance: 'Finance', support: 'Support',
  analytics: 'Analytics', commerce: 'Commerce', meetings: 'Meetings', hr: 'HR',
};

export default function ConnectPage() {
  const [nangoKey, setNangoKey] = useState('');
  const [nangoStatus, setNangoStatus] = useState<'idle' | 'testing' | 'ok' | 'skip' | 'err'>('idle');
  const [nangoMsg, setNangoMsg] = useState('');
  const [expanded, setExpanded] = useState<string | null>('comms');

  async function handleNango() {
    setNangoStatus('testing');
    const result = await testAndSaveNango(nangoKey);
    if (!nangoKey) { setNangoStatus('skip'); setNangoMsg(result.message); return; }
    setNangoStatus(result.ok ? 'ok' : 'err');
    setNangoMsg(result.message);
  }

  const ready = nangoStatus === 'ok' || nangoStatus === 'skip';

  return (
    <div className='animate-fade-up space-y-6'>
      <div className='text-[10px] uppercase tracking-[0.22em] text-[var(--v-text-muted)]'>Step 4 of 6 — Sources</div>
      <Heading2>Connect your sources</Heading2>
      <Body dim>VitaOS ingests from any system. Nango handles 250+ OAuth flows. Generic REST covers anything else. You can add more later from the app.</Body>

      <div className='glass rounded-xl p-5 space-y-3'>
        <div className='flex items-center gap-2'>
          <div className='w-5 h-5 rounded bg-[var(--v-teal)] flex items-center justify-center text-[10px] text-black font-bold'>N</div>
          <span className='text-sm font-medium'>Nango — 250+ managed OAuth connectors</span>
          {nangoStatus === 'ok' && <Badge label='Connected' variant='green' />}
          {nangoStatus === 'skip' && <Badge label='Skipped' variant='default' />}
        </div>
        <label className='block'>
          <span className='text-xs text-[var(--v-text-dim)] mb-1.5 block'>Nango secret key <span className='text-[var(--v-text-muted)]'>(optional — skip to use REST connectors only)</span></span>
          <input value={nangoKey} onChange={e => setNangoKey(e.target.value)} type='password' placeholder='leave blank to skip'
            className='w-full bg-[var(--v-surface-3)] border border-[var(--v-border)] rounded-lg px-3 py-2 text-sm placeholder:text-[var(--v-text-muted)] focus:outline-none focus:border-[var(--v-accent)] transition-v' />
        </label>
        {nangoMsg && (
          <div className={`text-xs px-2 py-1.5 rounded ${nangoStatus === 'ok' || nangoStatus === 'skip' ? 'text-[var(--v-green)]' : 'text-[var(--v-rose)]'}`}>{nangoMsg}</div>
        )}
        <GradientButton variant='secondary' onClick={handleNango} disabled={nangoStatus === 'testing'}>
          {nangoStatus === 'testing' ? 'Verifying…' : nangoKey ? 'Verify Nango key' : 'Skip — use REST connectors only'}
        </GradientButton>
      </div>

      <div className='glass rounded-xl p-5 space-y-2'>
        <div className='text-sm font-medium'>Generic REST API</div>
        <div className='text-xs text-[var(--v-text-dim)]'>Any HTTP endpoint. Base URL + auth header + JSON path. Configure from the Sources page after setup.</div>
        <Badge label='Available after setup' />
      </div>

      <div>
        <div className='text-xs uppercase tracking-widest text-[var(--v-text-muted)] mb-3'>Supported via Nango</div>
        <div className='space-y-1'>
          {Object.entries(byCategory).map(([cat, providers]) => (
            <div key={cat}>
              <button
                onClick={() => setExpanded(expanded === cat ? null : cat)}
                className='w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--v-surface-2)] transition-v text-xs'
              >
                <span className='font-medium'>{CATEGORY_LABELS[cat] ?? cat}</span>
                <span className='text-[var(--v-text-muted)]'>{providers.length} connectors {expanded === cat ? '↑' : '↓'}</span>
              </button>
              {expanded === cat && (
                <div className='px-3 pb-2 flex flex-wrap gap-1.5 animate-fade-in'>
                  {providers.map(p => (
                    <span key={p.key} className='text-[10px] px-2 py-0.5 rounded bg-[var(--v-surface-2)] text-[var(--v-text-dim)]'>{p.displayName}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className='flex justify-between pt-2'>
        <a href='/welcome/openrouter'><GradientButton variant='ghost'>← Back</GradientButton></a>
        <a href='/welcome/meet-tom'>
          <GradientButton variant='primary' disabled={!ready}>Continue →</GradientButton>
        </a>
      </div>
    </div>
  );
}
