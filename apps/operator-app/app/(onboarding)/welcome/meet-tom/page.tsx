'use client';
import { useState } from 'react';
import { Heading2, Body, GradientButton, GlassCard, GradientOrb } from '@/app/_components/ui';
import { saveAgentSettings } from '@/app/actions/onboarding';

const AUTONOMY = [
  { level: 'L1' as const, label: 'Observe only', desc: 'Reads, watches, briefs. Never acts without explicit request.', color: 'text-[var(--v-accent)]' },
  { level: 'L2' as const, label: 'Suggest & draft', desc: 'Drafts emails, proposals, CRM updates. You approve every external action.', color: 'text-[var(--v-teal)]', recommended: true },
  { level: 'L3' as const, label: 'Supervised actor', desc: 'Acts on internal writes automatically. External sends require approval.', color: 'text-[var(--v-amber)]' },
  { level: 'L4' as const, label: 'Full autonomy', desc: 'Acts freely. Deny guardrail still blocks dangerous patterns.', color: 'text-[var(--v-rose)]' },
];

export default function MeetTomPage() {
  const [selected, setSelected] = useState<'L1' | 'L2' | 'L3' | 'L4'>('L2');
  const [tomName, setTomName] = useState('Tom');
  const [timName, setTimName] = useState('Tim');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    await saveAgentSettings({ autonomyDefault: selected, tomName: tomName || 'Tom', timName: timName || 'Tim' });
    setBusy(false);
    setSaved(true);
  }

  return (
    <div className='animate-fade-up space-y-6 relative'>
      <GradientOrb size={350} />
      <div className='relative z-10 space-y-6'>
        <div className='text-[10px] uppercase tracking-[0.22em] text-[var(--v-text-muted)]'>Step 5 of 6 — Agents</div>
        <Heading2><span className='gradient-text'>Meet your co-pilots</span></Heading2>
        <Body dim>Tom is your personal AI. Tim coordinates the team. Deny is the guardrail. Set how much autonomy they have — you can change this any time.</Body>

        <div className='grid grid-cols-2 gap-3'>
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

        <div className='space-y-2'>
          <div className='text-xs uppercase tracking-widest text-[var(--v-text-muted)] mb-2'>Default autonomy level</div>
          {AUTONOMY.map(a => (
            <GlassCard key={a.level}
              className={`p-4 cursor-pointer transition-v ${selected === a.level ? 'gradient-border ring-1 ring-[var(--v-accent-soft)]' : ''}`}
              hover={selected !== a.level}
            >
              <button onClick={() => setSelected(a.level)} className='w-full text-left flex items-start gap-3'>
                <div className={`text-sm font-mono font-bold mt-0.5 ${a.color}`}>{a.level}</div>
                <div className='flex-1'>
                  <div className='text-sm font-medium flex items-center gap-2'>
                    {a.label}
                    {a.recommended && <span className='text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-[var(--v-accent-soft)] text-[var(--v-accent)]'>Recommended</span>}
                  </div>
                  <div className='text-xs text-[var(--v-text-dim)] mt-0.5'>{a.desc}</div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${selected === a.level ? 'border-[var(--v-accent)] bg-[var(--v-accent)]' : 'border-[var(--v-border)]'}`} />
              </button>
            </GlassCard>
          ))}
        </div>

        <GradientButton variant={saved ? 'secondary' : 'primary'} onClick={handleSave} disabled={busy || saved}>
          {saved ? `✓ Saved — ${tomName} is ${selected}` : busy ? 'Saving…' : 'Save settings'}
        </GradientButton>

        <div className='flex justify-between pt-2'>
          <a href='/welcome/connect'><GradientButton variant='ghost'>← Back</GradientButton></a>
          <a href='/welcome/done'><GradientButton variant='primary' disabled={!saved}>Finish setup →</GradientButton></a>
        </div>
      </div>
    </div>
  );
}
