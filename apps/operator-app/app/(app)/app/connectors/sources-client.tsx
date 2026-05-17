'use client';
import { useState, useTransition } from 'react';
import { Heading2, GlassCard, GradientButton, Badge, StatusDot, FadeIn, SectionLabel } from '@/app/_components/ui';
import { addNangoSource, addRestSource, syncSourceNow, deleteSource } from '@/app/actions/sources';
import { NANGO_PROVIDER_REGISTRY, type NangoProviderMeta } from '@vita/integrations/nango';
import type { SourceRow } from '@/app/actions/sources';

const nangoProviders = Object.values(NANGO_PROVIDER_REGISTRY) as NangoProviderMeta[];

type Modal = 'none' | 'nango' | 'rest';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function SourcesClient({ initialSources, onboarded }: { initialSources: SourceRow[]; onboarded: boolean }) {
  const [sources, setSources] = useState(initialSources);
  const [modal, setModal] = useState<Modal>('none');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, { ok: boolean; upserted: number; errors: string[] }>>({});
  const [isPending, startTransition] = useTransition();

  // Nango form
  const [nangoProvider, setNangoProvider] = useState('');
  const [nangoConnId, setNangoConnId] = useState('');
  const [nangoLabel, setNangoLabel] = useState('');
  const [nangoMsg, setNangoMsg] = useState('');

  // REST form
  const [restLabel, setRestLabel] = useState('');
  const [restUrl, setRestUrl] = useState('');
  const [restPath, setRestPath] = useState('');
  const [restJsonPath, setRestJsonPath] = useState('');
  const [restId, setRestId] = useState('id');
  const [restTitle, setRestTitle] = useState('title');
  const [restBody, setRestBody] = useState('');
  const [restUrlField, setRestUrlField] = useState('');
  const [restUpdated, setRestUpdated] = useState('updated_at');
  const [restAuthHeader, setRestAuthHeader] = useState('Authorization');
  const [restAuthValue, setRestAuthValue] = useState('');
  const [restType, setRestType] = useState('record');
  const [restMsg, setRestMsg] = useState('');
  const [restBusy, setRestBusy] = useState(false);

  async function handleSync(id: string) {
    setSyncingId(id);
    const r = await syncSourceNow(id);
    setSyncingId(null);
    setSyncResults(prev => ({ ...prev, [id]: r }));
    // refresh list
    startTransition(async () => {
      const { listSources } = await import('@/app/actions/sources');
      setSources(await listSources());
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this source?')) return;
    await deleteSource(id);
    setSources(prev => prev.filter(s => s.id !== id));
  }

  async function handleAddNango() {
    setNangoMsg('');
    if (!nangoProvider || !nangoConnId) { setNangoMsg('Provider and connection ID required.'); return; }
    const nangoOpts: Parameters<typeof addNangoSource>[0] = { provider: nangoProvider, connectionId: nangoConnId };
    if (nangoLabel) nangoOpts.label = nangoLabel;
    const r = await addNangoSource(nangoOpts);
    if (!r.ok) { setNangoMsg(r.message); return; }
    setModal('none');
    const { listSources } = await import('@/app/actions/sources');
    setSources(await listSources());
  }

  async function handleAddRest() {
    setRestBusy(true); setRestMsg('');
    if (!restLabel || !restUrl || !restPath) { setRestMsg('Label, base URL, and list path required.'); setRestBusy(false); return; }
    const opts: Parameters<typeof addRestSource>[0] = {
      label: restLabel, baseUrl: restUrl, listPath: restPath, listJsonPath: restJsonPath,
      idField: restId, titleField: restTitle, authHeader: restAuthHeader, authValue: restAuthValue, type: restType,
    };
    if (restBody) opts.bodyField = restBody;
    if (restUrlField) opts.urlField = restUrlField;
    if (restUpdated) opts.updatedAtField = restUpdated;
    const r = await addRestSource(opts);
    setRestBusy(false);
    if (!r.ok) { setRestMsg(r.message); return; }
    setModal('none');
    const { listSources } = await import('@/app/actions/sources');
    setSources(await listSources());
  }

  const statusDot = (status: string) => status === 'success' ? 'ok' as const : status === 'running' ? 'warn' as const : status === 'failed' ? 'err' as const : 'off' as const;

  return (
    <div className='space-y-5'>
      <FadeIn>
        <div className='flex items-start justify-between'>
          <div>
            <Heading2>Sources</Heading2>
            <p className='text-sm text-[var(--v-text-dim)] mt-1'>Every connected system that feeds your context engine.</p>
          </div>
          {onboarded && (
            <div className='flex gap-2'>
              <GradientButton variant='secondary' onClick={() => setModal('nango')}>+ Nango</GradientButton>
              <GradientButton variant='primary' onClick={() => setModal('rest')}>+ REST API</GradientButton>
            </div>
          )}
        </div>
      </FadeIn>

      {!onboarded && (
        <FadeIn delay={100}>
          <GlassCard className='p-6 text-center'>
            <div className='text-sm font-medium'>Setup not complete</div>
            <p className='text-xs text-[var(--v-text-dim)] mt-1'>Complete onboarding first to add sources.</p>
            <a href='/welcome' className='text-xs text-[var(--v-accent)] hover:underline mt-2 inline-block'>Go to setup →</a>
          </GlassCard>
        </FadeIn>
      )}

      {onboarded && (
        <>
          <FadeIn delay={100}>
            <div className='grid grid-cols-3 gap-3'>
              {[
                { tier: 'nango', label: 'Nango OAuth', desc: '250+ managed connectors', badge: 'teal' as const, action: () => setModal('nango') },
                { tier: 'rest', label: 'Generic REST', desc: 'Any HTTP API with JSON', badge: 'accent' as const, action: () => setModal('rest') },
                { tier: 'custom', label: 'Custom SDK', desc: '@vita/connector-sdk', badge: 'default' as const, action: () => {} },
              ].map(t => (
                <button key={t.tier} onClick={t.action} className='text-left'>
                  <GlassCard className='p-4 h-full' hover>
                    <Badge label={t.label} variant={t.badge} />
                    <div className='text-xs text-[var(--v-text-dim)] mt-2'>{t.desc}</div>
                  </GlassCard>
                </button>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <SectionLabel>Connected ({sources.length})</SectionLabel>
            {sources.length === 0 ? (
              <GlassCard className='p-10 text-center'>
                <div className='text-2xl mb-3'>⟶</div>
                <div className='text-sm text-[var(--v-text-dim)]'>No sources yet. Add a Nango connector or REST API to start ingesting data.</div>
              </GlassCard>
            ) : (
              <div className='space-y-2'>
                {sources.map(s => {
                  const res = syncResults[s.id];
                  return (
                    <GlassCard key={s.id} className='p-4' hover>
                      <div className='flex items-center gap-3'>
                        <StatusDot status={statusDot(s.status)} />
                        <div className='flex-1 min-w-0'>
                          <div className='text-sm font-medium flex items-center gap-2'>
                            {s.label ?? s.kind}
                            <Badge label={s.tier} variant={s.tier === 'nango' ? 'teal' : s.tier === 'rest' ? 'accent' : 'default'} />
                          </div>
                          <div className='text-xs text-[var(--v-text-dim)] mt-0.5 flex items-center gap-3'>
                            {s.lastSyncAt ? `${s.lastSyncCount.toLocaleString()} entities · synced ${relativeTime(s.lastSyncAt)}` : 'Never synced'}
                            {s.lastError && <span className='text-[var(--v-rose)] truncate max-w-xs'>{s.lastError}</span>}
                          </div>
                          {res && (
                            <div className={`text-xs mt-1 ${res.ok ? 'text-[var(--v-green)]' : 'text-[var(--v-rose)]'}`}>
                              {res.ok ? `↑ ${res.upserted} upserted` : `Error: ${res.errors[0]}`}
                            </div>
                          )}
                        </div>
                        <div className='flex items-center gap-2'>
                          <GradientButton variant='secondary' onClick={() => handleSync(s.id)} disabled={syncingId === s.id}>
                            {syncingId === s.id ? 'Syncing…' : 'Sync now'}
                          </GradientButton>
                          <button onClick={() => handleDelete(s.id)} className='text-xs text-[var(--v-rose)] hover:underline transition-v'>Remove</button>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </FadeIn>
        </>
      )}

      {/* Nango modal */}
      {modal === 'nango' && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
          <div className='bg-[var(--v-surface)] border border-[var(--v-border)] rounded-2xl p-6 w-full max-w-md mx-4 space-y-4 animate-fade-up'>
            <div className='font-display font-semibold text-lg gradient-text'>Add Nango source</div>
            <div className='space-y-3'>
              <label className='block'>
                <span className='text-xs text-[var(--v-text-dim)] mb-1 block'>Provider</span>
                <select value={nangoProvider} onChange={e => { setNangoProvider(e.target.value); setNangoLabel(nangoProviders.find(p => p.key === e.target.value)?.displayName ?? ''); }}
                  className='w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--v-accent)] transition-v appearance-none'>
                  <option value=''>Select provider…</option>
                  {nangoProviders.map(p => <option key={p.key} value={p.key}>{p.displayName}</option>)}
                </select>
              </label>
              <label className='block'>
                <span className='text-xs text-[var(--v-text-dim)] mb-1 block'>Nango connection ID</span>
                <input value={nangoConnId} onChange={e => setNangoConnId(e.target.value)} placeholder='e.g. user-123-notion'
                  className='w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--v-accent)] transition-v' />
                <span className='text-[10px] text-[var(--v-text-muted)]'>The connectionId from your Nango dashboard for this user</span>
              </label>
              <label className='block'>
                <span className='text-xs text-[var(--v-text-dim)] mb-1 block'>Label (optional)</span>
                <input value={nangoLabel} onChange={e => setNangoLabel(e.target.value)}
                  className='w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--v-accent)] transition-v' />
              </label>
              {nangoMsg && <div className='text-xs text-[var(--v-rose)]'>{nangoMsg}</div>}
            </div>
            <div className='flex gap-3 justify-end'>
              <GradientButton variant='ghost' onClick={() => setModal('none')}>Cancel</GradientButton>
              <GradientButton variant='primary' onClick={handleAddNango} disabled={!nangoProvider || !nangoConnId}>Add source</GradientButton>
            </div>
          </div>
        </div>
      )}

      {/* REST modal */}
      {modal === 'rest' && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8'>
          <div className='bg-[var(--v-surface)] border border-[var(--v-border)] rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4 animate-fade-up'>
            <div className='font-display font-semibold text-lg gradient-text'>Add REST API source</div>
            <div className='grid grid-cols-2 gap-3'>
              {[
                { label: 'Source name', value: restLabel, set: setRestLabel, placeholder: 'My SaaS' },
                { label: 'Entity type', value: restType, set: setRestType, placeholder: 'record' },
                { label: 'Base URL', value: restUrl, set: setRestUrl, placeholder: 'https://api.example.com' },
                { label: 'List endpoint path', value: restPath, set: setRestPath, placeholder: '/v1/records' },
                { label: 'JSON path to array', value: restJsonPath, set: setRestJsonPath, placeholder: 'data.items' },
                { label: 'ID field', value: restId, set: setRestId, placeholder: 'id' },
                { label: 'Title field', value: restTitle, set: setRestTitle, placeholder: 'name' },
                { label: 'Body field', value: restBody, set: setRestBody, placeholder: 'description (optional)' },
                { label: 'URL field', value: restUrlField, set: setRestUrlField, placeholder: 'url (optional)' },
                { label: 'Updated at field', value: restUpdated, set: setRestUpdated, placeholder: 'updated_at' },
              ].map(f => (
                <label key={f.label} className='block'>
                  <span className='text-xs text-[var(--v-text-dim)] mb-1 block'>{f.label}</span>
                  <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                    className='w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--v-accent)] transition-v' />
                </label>
              ))}
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <label className='block'>
                <span className='text-xs text-[var(--v-text-dim)] mb-1 block'>Auth header name</span>
                <input value={restAuthHeader} onChange={e => setRestAuthHeader(e.target.value)}
                  className='w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--v-accent)] transition-v' />
              </label>
              <label className='block'>
                <span className='text-xs text-[var(--v-text-dim)] mb-1 block'>Auth header value</span>
                <input value={restAuthValue} onChange={e => setRestAuthValue(e.target.value)} type='password' placeholder='Bearer sk-...'
                  className='w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--v-accent)] transition-v' />
              </label>
            </div>
            {restMsg && <div className='text-xs text-[var(--v-rose)]'>{restMsg}</div>}
            <div className='flex gap-3 justify-end'>
              <GradientButton variant='ghost' onClick={() => setModal('none')}>Cancel</GradientButton>
              <GradientButton variant='primary' onClick={handleAddRest} disabled={restBusy}>
                {restBusy ? 'Adding…' : 'Add source'}
              </GradientButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
