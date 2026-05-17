'use client';
import { useState } from 'react';
import { Heading2, GlassCard, GradientButton, Badge, FadeIn, SectionLabel } from '@/app/_components/ui';
import { decideApproval } from '@/app/actions/approvals';
import type { ApprovalRow } from '@/app/actions/approvals';

const RISK_COLORS = { L1: 'accent', L2: 'default', L3: 'amber', L4: 'rose' } as const;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function ApprovalsClient({ initialApprovals, tomName, onboarded }: {
  initialApprovals: ApprovalRow[];
  tomName: string;
  onboarded: boolean;
}) {
  const [approvals, setApprovals] = useState(initialApprovals);
  const [deciding, setDeciding] = useState<Record<string, boolean>>({});

  async function handleDecide(id: string, decision: 'approved' | 'rejected') {
    setDeciding(p => ({ ...p, [id]: true }));
    await decideApproval(id, decision);
    setApprovals(prev => prev.filter(a => a.id !== id));
    setDeciding(p => { const n = { ...p }; delete n[id]; return n; });
  }

  return (
    <div className='space-y-5'>
      <FadeIn>
        <div className='flex items-center justify-between'>
          <div>
            <Heading2>Approvals</Heading2>
            <p className='text-sm text-[var(--v-text-dim)] mt-1'>
              {approvals.length > 0
                ? `${approvals.length} pending — ${tomName} is waiting for your decision`
                : `No pending approvals — ${tomName} is within autonomous bounds`}
            </p>
          </div>
          {approvals.length > 0 && <Badge label={`${approvals.length} pending`} variant='amber' />}
        </div>
      </FadeIn>

      {!onboarded && (
        <GlassCard className='p-6 text-center'>
          <p className='text-sm text-[var(--v-text-dim)]'>Complete setup to see approvals.</p>
          <a href='/welcome' className='text-xs text-[var(--v-accent)] hover:underline mt-1 inline-block'>Go to setup →</a>
        </GlassCard>
      )}

      {onboarded && approvals.length === 0 && (
        <FadeIn delay={100}>
          <GlassCard className='p-10 text-center'>
            <div className='text-3xl mb-3'>✓</div>
            <div className='text-sm font-medium gradient-text'>All clear</div>
            <p className='text-xs text-[var(--v-text-dim)] mt-1'>
              Approvals appear when {tomName} proposes an action that exceeds your autonomy level.
              Add sources and set autonomy in <a href='/app/policies' className='text-[var(--v-accent)] hover:underline'>Policies</a>.
            </p>
          </GlassCard>
        </FadeIn>
      )}

      {onboarded && approvals.length > 0 && (
        <FadeIn delay={100}>
          <SectionLabel>Pending decisions</SectionLabel>
          <div className='space-y-3'>
            {approvals.map((a, i) => {
              const riskColor = RISK_COLORS[(a.risk as keyof typeof RISK_COLORS)] ?? 'default';
              const payloadStr = JSON.stringify(a.payload, null, 2);
              return (
                <FadeIn key={a.id} delay={i * 60}>
                  <GlassCard className='p-5'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex-1 space-y-2'>
                        <div className='flex items-center gap-2'>
                          <Badge label={a.kind} variant='accent' />
                          <Badge label={`risk ${a.risk}`} variant={riskColor} />
                          <span className='text-xs text-[var(--v-text-muted)]'>{a.proposer} · {relativeTime(a.createdAt)}</span>
                        </div>
                        <div className='text-sm font-medium'>{a.payload?.description as string ?? a.kind}</div>
                        {payloadStr.length < 300 && (
                          <pre className='text-xs text-[var(--v-text-dim)] bg-[var(--v-surface-2)] rounded-lg p-3 overflow-x-auto'>{payloadStr}</pre>
                        )}
                      </div>
                      <div className='flex flex-col gap-2 shrink-0'>
                        <GradientButton variant='primary' onClick={() => handleDecide(a.id, 'approved')} disabled={deciding[a.id]}
                          className='bg-[var(--v-green-soft)] text-[var(--v-green)] border border-[var(--v-green)]/30 hover:brightness-110'>
                          {deciding[a.id] ? '…' : 'Approve'}
                        </GradientButton>
                        <GradientButton variant='ghost' onClick={() => handleDecide(a.id, 'rejected')} disabled={deciding[a.id]}
                          className='text-[var(--v-rose)] hover:bg-[var(--v-rose-soft)]'>
                          {deciding[a.id] ? '…' : 'Reject'}
                        </GradientButton>
                      </div>
                    </div>
                  </GlassCard>
                </FadeIn>
              );
            })}
          </div>
        </FadeIn>
      )}
    </div>
  );
}
