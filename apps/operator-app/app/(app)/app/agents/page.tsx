import { Heading2, GlassCard, SectionLabel, FadeIn, Badge } from '@/app/_components/ui';
import { getWorkspaceInfo } from '@/app/actions/dashboard';

export const dynamic = 'force-dynamic';

const BUILTIN_AGENTS = [
  { id: 'tom', name: 'Tom', kind: 'personal', autonomy: 'L2', desc: 'Your personal co-pilot. Reads context, drafts content, proposes actions within your boundaries.', boundary: true },
  { id: 'tim', name: 'Tim', kind: 'team', autonomy: 'L1', desc: 'Team coordinator. Routes team-level updates through each member\'s Tom.', boundary: false },
  { id: 'deny', name: 'Deny', kind: 'guardrail', autonomy: 'L4', desc: 'Safety guardrail. Blocks actions that violate policy, expose PII, or breach boundaries.', boundary: false },
  { id: 'lex', name: 'Lex', kind: 'specialist', autonomy: 'L2', desc: 'Legal and compliance reasoning. Risk-flags contracts, SLAs, and regulatory exposure.', boundary: false },
  { id: 'hera', name: 'Hera', kind: 'specialist', autonomy: 'L2', desc: 'Calendar and scheduling coordination. Finds slots, manages invites.', boundary: false },
  { id: 'cal', name: 'Cal', kind: 'specialist', autonomy: 'L2', desc: 'Financial and accounting assistant. Revenue models, P&L reasoning.', boundary: false },
];

const LIBRARIANS = [
  { id: 'entity-linker', name: 'EntityLinker', desc: 'Deduplicates and links entities across sources' },
  { id: 'conflict-resolver', name: 'ConflictResolver', desc: 'Resolves conflicting facts with confidence scoring' },
  { id: 'index-keeper', name: 'IndexKeeper', desc: 'Keeps search indexes in sync with entity changes' },
  { id: 'lineage-scribe', name: 'LineageScribe', desc: 'Records derivation provenance for every fact' },
  { id: 'anonymizer', name: 'Anonymizer', desc: 'PII detection and redaction pipeline' },
  { id: 'pack-overlay', name: 'PackOverlayApplier', desc: 'Applies ontology pack overlays on entity upsert' },
  { id: 'boundary-recorder', name: 'BoundaryRecorder', desc: 'Audits every boundary crossing by agents' },
  { id: 'vocab-applier', name: 'VocabularyApplier', desc: 'Normalises terms against active pack vocabularies' },
];

const KIND_COLORS = { personal: 'accent', team: 'teal', guardrail: 'rose', specialist: 'default' } as const;
const AUTONOMY_COLORS = { L1: 'teal', L2: 'accent', L3: 'amber', L4: 'rose' } as const;

export default async function AgentsPage() {
  const info = await getWorkspaceInfo();
  const tomLabel = info.tomName !== 'Tom' ? `${info.tomName} (Tom)` : 'Tom';
  const timLabel = info.timName !== 'Tim' ? `${info.timName} (Tim)` : 'Tim';

  return (
    <div className='space-y-6'>
      <FadeIn>
        <Heading2>Agents</Heading2>
        <p className='text-sm text-[var(--v-text-dim)] mt-1'>Your AI workforce — each with defined boundaries, autonomy levels, and roles.</p>
      </FadeIn>

      <FadeIn delay={100}>
        <SectionLabel>Core agents</SectionLabel>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          {BUILTIN_AGENTS.map(a => (
            <GlassCard key={a.id} className='p-4' hover>
              <div className='flex items-start justify-between gap-2'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium'>{a.id === 'tom' ? tomLabel : a.id === 'tim' ? timLabel : a.name}</span>
                    <Badge label={a.kind} variant={KIND_COLORS[a.kind as keyof typeof KIND_COLORS] ?? 'default'} />
                    <Badge label={a.autonomy} variant={AUTONOMY_COLORS[a.autonomy as keyof typeof AUTONOMY_COLORS] ?? 'default'} />
                    {a.boundary && <Badge label='boundary' variant='rose' />}
                  </div>
                  <p className='text-xs text-[var(--v-text-dim)] mt-1.5 leading-relaxed'>{a.desc}</p>
                </div>
                <div className='w-2 h-2 rounded-full bg-[var(--v-green)] animate-pulse shrink-0 mt-1.5' />
              </div>
            </GlassCard>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <SectionLabel>Librarians <span className='text-[var(--v-text-muted)] ml-1'>background workers</span></SectionLabel>
        <div className='grid grid-cols-2 gap-2'>
          {LIBRARIANS.map(l => (
            <GlassCard key={l.id} className='p-3' hover>
              <div className='text-xs font-medium text-[var(--v-accent)]'>{l.name}</div>
              <div className='text-[10px] text-[var(--v-text-dim)] mt-0.5'>{l.desc}</div>
            </GlassCard>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={300}>
        <GlassCard className='p-4'>
          <div className='text-sm font-medium'>MCP access</div>
          <p className='text-xs text-[var(--v-text-dim)] mt-1'>
            {info.tomName} and {info.timName} expose JSON-RPC 2.0 servers.
            Run <code className='text-[var(--v-accent)]'>pnpm --filter @vita/app-tom-mcp dev</code> to start Tom on stdio, or connect via Claude Desktop, Cursor, or any MCP client.
          </p>
          <a href='/platform/mcp' className='text-xs text-[var(--v-accent)] hover:underline mt-2 inline-block'>MCP docs →</a>
        </GlassCard>
      </FadeIn>
    </div>
  );
}
