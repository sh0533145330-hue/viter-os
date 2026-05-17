'use client';
import { useState } from 'react';
import { Heading2, Body, GradientButton, Badge, GlassCard } from '@/app/_components/ui';
import { testAndSaveOpenRouter } from '@/app/actions/onboarding';

const POPULAR_MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', note: 'Best overall — recommended' },
  { id: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku', note: 'Fastest, cheapest' },
  { id: 'openai/gpt-4o', label: 'GPT-4o', note: 'Strong reasoning' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', note: 'Budget option' },
  { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash', note: 'Fast multimodal' },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', note: 'Open source' },
];

export default function OpenRouterPage() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');
  const [modelCount, setModelCount] = useState<number>();

  async function handleTest() {
    setStatus('testing'); setMsg('');
    const result = await testAndSaveOpenRouter(apiKey);
    if (result.ok) {
      setStatus('ok');
      setMsg(result.message);
      if (result.models !== undefined) setModelCount(result.models);
    } else {
      setStatus('err');
      setMsg(result.message);
    }
  }

  return (
    <div className='animate-fade-up space-y-6'>
      <div className='text-[10px] uppercase tracking-[0.22em] text-[var(--v-text-muted)]'>Step 3 of 6 — OpenRouter</div>
      <Heading2>Connect the AI layer</Heading2>
      <Body dim>One API key. Every model. Tom, Tim, embeddings, and extraction all route through OpenRouter — you control model choice and cost.</Body>

      <label className='block'>
        <span className='text-xs text-[var(--v-text-dim)] mb-1.5 block'>OpenRouter API key</span>
        <input value={apiKey} onChange={e => setApiKey(e.target.value)} type='password' placeholder='sk-or-...'
          className='w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-xl px-4 py-2.5 text-sm placeholder:text-[var(--v-text-muted)] focus:outline-none focus:border-[var(--v-accent)] transition-v' />
      </label>

      {status !== 'idle' && (
        <div className={`text-sm px-3 py-2 rounded-lg transition-v ${status === 'ok' ? 'bg-[var(--v-green-soft)] text-[var(--v-green)]' : status === 'err' ? 'bg-[var(--v-rose-soft)] text-[var(--v-rose)]' : 'text-[var(--v-text-dim)]'}`}>
          {status === 'testing' ? 'Verifying key…' : msg}{modelCount ? ` · ${modelCount} models available` : ''}
        </div>
      )}

      <div className='flex items-center gap-3'>
        <GradientButton variant='primary' onClick={handleTest} disabled={!apiKey || status === 'testing'}>
          {status === 'testing' ? 'Verifying…' : 'Verify key'}
        </GradientButton>
        {status === 'ok' && <Badge label='✓ Key valid' variant='green' />}
      </div>

      {status === 'ok' && (
        <div className='animate-fade-up space-y-2'>
          <div className='text-xs uppercase tracking-widest text-[var(--v-text-muted)]'>Default model for Tom</div>
          <div className='grid grid-cols-2 gap-2'>
            {POPULAR_MODELS.map(m => (
              <GlassCard key={m.id} className='p-3 cursor-pointer' hover>
                <div className='text-xs font-medium'>{m.label}</div>
                <div className='text-[10px] text-[var(--v-text-muted)] mt-0.5'>{m.note}</div>
              </GlassCard>
            ))}
          </div>
          <div className='text-[10px] text-[var(--v-text-muted)]'>Model saved with key — can change any time in settings.</div>
        </div>
      )}

      <div className='flex justify-between pt-4'>
        <a href='/welcome/supabase'><GradientButton variant='ghost'>← Back</GradientButton></a>
        <a href='/welcome/connect'><GradientButton variant='primary' disabled={status !== 'ok'}>Continue →</GradientButton></a>
      </div>
    </div>
  );
}
