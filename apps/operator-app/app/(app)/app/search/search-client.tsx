'use client';
import { useState, useRef } from 'react';
import { Heading2, GlassCard, GradientButton, Badge, FadeIn, SectionLabel } from '@/app/_components/ui';
import { askTom } from '@/app/actions/search';
import type { RagCitation } from '@vita/integrations';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: RagCitation[];
  model?: string;
  error?: string;
}

export function SearchClient({
  sourceKinds, entityTypes, tomName, onboarded,
}: {
  sourceKinds: Array<{ kind: string; count: number }>;
  entityTypes: Array<{ type: string; count: number }>;
  tomName: string;
  onboarded: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const totalEntities = sourceKinds.reduce((s, k) => s + k.count, 0);

  const SUGGESTED = [
    `What are my most recent records?`,
    `Summarise what changed this week`,
    `Who are the key people I should follow up with?`,
    `What are the biggest open risks?`,
  ];

  async function handleAsk(q = query) {
    if (!q.trim() || busy) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setBusy(true);
    const opts: { sourceFilter?: string; typeFilter?: string } = {};
    if (sourceFilter) opts.sourceFilter = sourceFilter;
    if (typeFilter) opts.typeFilter = typeFilter;
    const result = await askTom(q, opts);
    const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: result.error ? '' : result.answer };
    if (result.citations.length > 0) assistantMsg.citations = result.citations;
    if (result.model) assistantMsg.model = result.model;
    if (result.error) assistantMsg.error = result.error;
    setMessages(prev => [...prev, assistantMsg]);
    setBusy(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  return (
    <div className='space-y-5 flex flex-col h-full'>
      <FadeIn>
        <div className='flex items-start justify-between'>
          <div>
            <Heading2>Ask {tomName}</Heading2>
            <p className='text-sm text-[var(--v-text-dim)] mt-1'>
              {totalEntities > 0
                ? `${totalEntities.toLocaleString()} entities across ${sourceKinds.length} source${sourceKinds.length !== 1 ? 's' : ''} — hybrid search + cited answers`
                : 'Connect and sync sources to get cited answers over your real data'}
            </p>
          </div>
          {sourceKinds.length > 0 && (
            <div className='flex gap-2'>
              <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
                className='bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--v-accent)] transition-v appearance-none'>
                <option value=''>All sources</option>
                {sourceKinds.map(k => <option key={k.kind} value={k.kind}>{k.kind} ({k.count})</option>)}
              </select>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className='bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--v-accent)] transition-v appearance-none'>
                <option value=''>All types</option>
                {entityTypes.map(t => <option key={t.type} value={t.type}>{t.type} ({t.count})</option>)}
              </select>
            </div>
          )}
        </div>
      </FadeIn>

      {!onboarded && (
        <GlassCard className='p-6 text-center'>
          <p className='text-sm text-[var(--v-text-dim)]'>Complete setup to enable search.</p>
          <a href='/welcome' className='text-xs text-[var(--v-accent)] hover:underline mt-1 inline-block'>Go to setup →</a>
        </GlassCard>
      )}

      {onboarded && messages.length === 0 && (
        <FadeIn delay={100}>
          <div className='space-y-3'>
            <SectionLabel>Suggested questions</SectionLabel>
            <div className='grid grid-cols-2 gap-2'>
              {SUGGESTED.map(s => (
                <button key={s} onClick={() => handleAsk(s)}
                  className='text-left glass glass-hover transition-v p-3 rounded-xl text-sm text-[var(--v-text-dim)] hover:text-[var(--v-text)]'>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {messages.length > 0 && (
        <div className='flex-1 overflow-y-auto space-y-4 min-h-0 max-h-[60vh]'>
          {messages.map(m => (
            <div key={m.id} className={`animate-fade-up ${m.role === 'user' ? 'flex justify-end' : ''}`}>
              {m.role === 'user' ? (
                <div className='glass rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%] text-sm bg-[var(--v-accent-soft)] border-[var(--v-accent-soft)]'>
                  {m.content}
                </div>
              ) : (
                <GlassCard className='p-5' hover={false}>
                  {m.error ? (
                    <div className='text-sm text-[var(--v-rose)]'>{m.error}</div>
                  ) : (
                    <>
                      <div className='text-sm leading-relaxed whitespace-pre-wrap'>{m.content}</div>
                      {m.citations && m.citations.length > 0 && (
                        <div className='mt-4 pt-3 border-t border-[var(--v-border)] space-y-1.5'>
                          <div className='text-[10px] uppercase tracking-widest text-[var(--v-text-muted)]'>Sources</div>
                          {m.citations.map((c, i) => (
                            <div key={c.id} className='text-xs flex gap-2 items-start'>
                              <span className='text-[var(--v-accent)] font-mono shrink-0'>[{i + 1}]</span>
                              <span className='text-[var(--v-text-dim)]'>
                                {c.url ? (
                                  <a href={c.url} target='_blank' rel='noopener noreferrer' className='hover:text-[var(--v-text)] transition-v'>{c.title}</a>
                                ) : c.title}
                                {' '}·{' '}
                                <Badge label={c.sourceKind} />
                                <Badge label={c.type} />
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {m.model && <div className='mt-2 text-[10px] text-[var(--v-text-muted)]'>{m.model}</div>}
                    </>
                  )}
                </GlassCard>
              )}
            </div>
          ))}
          {busy && (
            <div className='animate-fade-in'>
              <GlassCard className='p-4' hover={false}>
                <div className='flex gap-1.5 items-center text-sm text-[var(--v-text-dim)]'>
                  <span className='animate-pulse'>●</span>
                  <span className='animate-pulse delay-100'>●</span>
                  <span className='animate-pulse delay-200'>●</span>
                  <span className='ml-2'>{tomName} is thinking…</span>
                </div>
              </GlassCard>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {onboarded && (
        <FadeIn delay={200}>
          <form onSubmit={e => { e.preventDefault(); handleAsk(); }} className='glass rounded-2xl p-1.5 flex gap-2'>
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder={`Ask ${tomName} anything about your connected data…`}
              className='flex-1 bg-transparent px-4 py-2.5 text-sm placeholder:text-[var(--v-text-muted)] focus:outline-none'
              disabled={busy}
            />
            <GradientButton variant='primary' type='submit' disabled={!query.trim() || busy}>
              {busy ? '…' : 'Ask'}
            </GradientButton>
          </form>
        </FadeIn>
      )}
    </div>
  );
}
