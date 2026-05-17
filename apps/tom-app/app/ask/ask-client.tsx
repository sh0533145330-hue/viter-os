'use client';
import { useState, useRef, useEffect } from 'react';
import { askTom } from '../actions/ask';
import type { AskResult } from '../actions/ask';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: AskResult['citations'];
  error?: string;
}

export function AskClient({ tomName }: { tomName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    setInput('');
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setBusy(true);
    const result = await askTom(q);
    const aMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: result.answer };
    if (result.citations && result.citations.length > 0) aMsg.citations = result.citations;
    if (result.error) aMsg.error = result.error;
    setMessages(prev => [...prev, aMsg]);
    setBusy(false);
  }

  return (
    <>
      <div className='flex-1 overflow-y-auto px-4 pb-4 space-y-3'>
        {messages.length === 0 && (
          <div className='pt-6 text-sm text-[var(--tom-text-dim)] text-center'>
            <p>Ask {tomName} anything about your world.</p>
            <div className='mt-4 space-y-2'>
              {['What happened today?', 'Any decisions waiting?', 'Summarise my pipeline.'].map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className='block w-full text-left rounded-xl bg-[var(--tom-surface)] border border-[var(--tom-border)] p-3 text-xs hover:border-[var(--tom-accent)] transition-colors'>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`rounded-xl p-3 text-sm ${m.role === 'user' ? 'bg-[var(--tom-surface-2)] ml-6' : 'bg-[var(--tom-accent-soft)] border border-[var(--tom-accent)]/30 mr-6'}`}>
            {m.error
              ? <p className='text-red-400 text-xs'>{m.error}</p>
              : <p className='leading-relaxed whitespace-pre-wrap'>{m.content}</p>
            }
            {m.citations && m.citations.length > 0 && (
              <div className='mt-2 flex flex-wrap gap-1'>
                {m.citations.map(c => (
                  c.url
                    ? <a key={c.id} href={c.url} target='_blank' rel='noopener noreferrer' className='text-[10px] px-1.5 py-0.5 rounded bg-[var(--tom-surface-2)] border border-[var(--tom-border)] hover:border-[var(--tom-accent)] transition-colors'>{c.title}</a>
                    : <span key={c.id} className='text-[10px] px-1.5 py-0.5 rounded bg-[var(--tom-surface-2)] border border-[var(--tom-border)]'>{c.title}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className='rounded-xl bg-[var(--tom-accent-soft)] border border-[var(--tom-accent)]/30 mr-6 p-3'>
            <div className='flex gap-1 items-center'>
              <span className='w-1.5 h-1.5 rounded-full bg-[var(--tom-accent)] animate-bounce [animation-delay:0ms]' />
              <span className='w-1.5 h-1.5 rounded-full bg-[var(--tom-accent)] animate-bounce [animation-delay:150ms]' />
              <span className='w-1.5 h-1.5 rounded-full bg-[var(--tom-accent)] animate-bounce [animation-delay:300ms]' />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className='border-t border-[var(--tom-border)] bg-[var(--tom-surface)] p-3'>
        <input
          type='text'
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Ask ${tomName} anything`}
          className='w-full bg-[var(--tom-surface-2)] border border-[var(--tom-border)] rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[var(--tom-accent)]'
          disabled={busy}
        />
      </form>
    </>
  );
}
