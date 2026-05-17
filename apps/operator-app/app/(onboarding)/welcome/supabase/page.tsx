'use client';
import { useState } from 'react';
import { Heading2, Body, GradientButton, CodeBlock, Badge } from '@/app/_components/ui';
import { testAndSaveSupabase, getSchemaSQL, bootstrapWorkspaceRow } from '@/app/actions/onboarding';

type Step = 'connect' | 'schema' | 'bootstrap' | 'done';

export default function SupabasePage() {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [step, setStep] = useState<Step>('connect');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [schemaSQL, setSchemaSQL] = useState('');
  const [showSQL, setShowSQL] = useState(false);

  async function handleTest() {
    setBusy(true); setMsg('');
    const result = await testAndSaveSupabase(url, key);
    setBusy(false);
    if (!result.ok) { setMsg(result.message); return; }
    if (result.schemaReady) { setStep('bootstrap'); setMsg('Connection verified. Schema already in place.'); }
    else { setStep('schema'); setMsg(result.message); }
  }

  async function handleShowSQL() {
    if (!schemaSQL) { const s = await getSchemaSQL(); setSchemaSQL(s); }
    setShowSQL(v => !v);
  }

  async function handleBootstrap() {
    setBusy(true); setMsg('');
    const result = await bootstrapWorkspaceRow();
    setBusy(false);
    setMsg(result.message);
    if (result.ok) setStep('done');
  }

  const canContinue = step === 'done';

  return (
    <div className='animate-fade-up space-y-6'>
      <div className='flex items-center gap-2'>
        {['connect','schema','bootstrap','done'].map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-all ${['connect','schema','bootstrap','done'].indexOf(step) >= i ? 'bg-[var(--v-accent)]' : 'bg-[var(--v-border)]'}`} />
        ))}
      </div>
      <div className='text-[10px] uppercase tracking-[0.22em] text-[var(--v-text-muted)]'>Step 2 of 6 — Supabase</div>
      <Heading2>Connect your database</Heading2>
      <Body dim>VitaOS stores ontology, entities, embeddings, and chat in your own Postgres. Bring a Supabase project — stay in control of your data.</Body>

      <div className='space-y-3'>
        <label className='block'>
          <span className='text-xs text-[var(--v-text-dim)] mb-1.5 block'>Project URL</span>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder='https://xxxxx.supabase.co'
            className='w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-xl px-4 py-2.5 text-sm placeholder:text-[var(--v-text-muted)] focus:outline-none focus:border-[var(--v-accent)] transition-v' />
        </label>
        <label className='block'>
          <span className='text-xs text-[var(--v-text-dim)] mb-1.5 block'>Service role key <span className='text-[var(--v-text-muted)]'>(server-only — never exposed to browser)</span></span>
          <input value={key} onChange={e => setKey(e.target.value)} type='password' placeholder='eyJ...'
            className='w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-xl px-4 py-2.5 text-sm placeholder:text-[var(--v-text-muted)] focus:outline-none focus:border-[var(--v-accent)] transition-v' />
        </label>
        {msg && (
          <div className={`text-sm px-3 py-2 rounded-lg ${step === 'done' || step === 'bootstrap' || step === 'schema' ? 'bg-[var(--v-green-soft)] text-[var(--v-green)]' : 'bg-[var(--v-rose-soft)] text-[var(--v-rose)]'}`}>
            {msg}
          </div>
        )}
      </div>

      {step === 'schema' && (
        <div className='space-y-3 animate-fade-up'>
          <div className='glass p-4 rounded-xl'>
            <div className='text-sm font-medium'>Schema not deployed yet</div>
            <div className='text-xs text-[var(--v-text-dim)] mt-1'>Run the SQL below in your Supabase SQL editor, then click Verify schema.</div>
          </div>
          <button onClick={handleShowSQL} className='text-xs text-[var(--v-accent)] hover:underline'>{showSQL ? 'Hide' : 'Show'} schema SQL</button>
          {showSQL && <CodeBlock lang='sql' code={schemaSQL.slice(0, 3000) + '\n-- (truncated — full schema in @vita/integrations/src/supabase.ts)'} />}
          <GradientButton variant='primary' onClick={handleBootstrap} disabled={busy}>I ran the SQL — verify &amp; continue</GradientButton>
        </div>
      )}

      {step === 'bootstrap' && (
        <div className='animate-fade-up'>
          <GradientButton variant='primary' onClick={handleBootstrap} disabled={busy}>
            {busy ? 'Creating workspace row…' : 'Bootstrap workspace row'}
          </GradientButton>
        </div>
      )}

      {(step === 'connect' || step === 'schema') && (
        <div className='flex gap-3'>
          <GradientButton variant='primary' onClick={handleTest} disabled={!url || !key || busy}>
            {busy ? 'Testing…' : step === 'schema' ? 'Re-test connection' : 'Test connection'}
          </GradientButton>
          {step === 'connect' && <button onClick={handleShowSQL} className='text-xs text-[var(--v-text-dim)] hover:text-[var(--v-text)] transition-v'>Preview schema SQL</button>}
        </div>
      )}
      {showSQL && step === 'connect' && <CodeBlock lang='sql' code={schemaSQL.slice(0, 3000) + '\n-- (see full schema in @vita/integrations/src/supabase.ts)'} />}

      <div className='flex justify-between pt-2'>
        <a href='/welcome/workspace'><GradientButton variant='ghost'>← Back</GradientButton></a>
        <a href='/welcome/openrouter'>
          <GradientButton variant='primary' disabled={!canContinue}>Continue →</GradientButton>
        </a>
      </div>
    </div>
  );
}
