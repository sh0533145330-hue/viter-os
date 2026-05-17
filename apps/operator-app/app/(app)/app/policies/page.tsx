import { Heading2, GlassCard, SectionLabel, FadeIn, Badge } from '@/app/_components/ui';
import { getWorkspaceInfo } from '@/app/actions/dashboard';
import { readWorkspace } from '@/app/lib/workspace-store';

export const dynamic = 'force-dynamic';

const BOUNDARY_RULES = [
  { action: 'Internal reads', level: 'L1', label: 'Auto', color: 'teal' as const, desc: 'Tom reads, observes, and summarises without asking' },
  { action: 'Internal writes', level: 'L2', label: 'Auto + audit', color: 'accent' as const, desc: 'CRM updates, task creation — with full audit trail' },
  { action: 'External sends', level: 'L3', label: 'Approval required', color: 'amber' as const, desc: 'Emails, Slack messages, calendar invites — needs your OK' },
  { action: 'Financial actions', level: 'L4', label: 'Dual approval', color: 'rose' as const, desc: 'Payments, contracts, spend — operator + named approver' },
];

export default async function PoliciesPage() {
  const [info, w] = await Promise.all([getWorkspaceInfo(), readWorkspace()]);
  const defaultLevel = w.autonomyDefault ?? 'L2';

  return (
    <div className='space-y-6'>
      <FadeIn>
        <Heading2>Policies</Heading2>
        <p className='text-sm text-[var(--v-text-dim)] mt-1'>Autonomy levels, boundary controls, and Cedar policy rules for {info.tomName}.</p>
      </FadeIn>

      <FadeIn delay={100}>
        <SectionLabel>Active autonomy level</SectionLabel>
        <GlassCard className='p-5 gradient-border'>
          <div className='flex items-center gap-4'>
            <div className='text-4xl font-mono font-bold gradient-text'>{defaultLevel}</div>
            <div>
              <div className='text-sm font-medium'>{BOUNDARY_RULES.find(r => r.level === defaultLevel)?.label ?? 'Custom'}</div>
              <div className='text-xs text-[var(--v-text-dim)] mt-0.5'>{BOUNDARY_RULES.find(r => r.level === defaultLevel)?.desc}</div>
              <a href='/welcome/meet-tom' className='text-xs text-[var(--v-accent)] hover:underline mt-1 inline-block'>Change →</a>
            </div>
          </div>
        </GlassCard>
      </FadeIn>

      <FadeIn delay={200}>
        <SectionLabel>Boundary rules</SectionLabel>
        <div className='space-y-2'>
          {BOUNDARY_RULES.map(r => (
            <GlassCard key={r.level} className={`p-4 ${r.level === defaultLevel ? 'gradient-border' : ''}`} hover>
              <div className='flex items-center justify-between gap-3'>
                <div className='flex items-center gap-3'>
                  <span className={`text-sm font-mono font-bold text-[var(--v-${r.color})]`}>{r.level}</span>
                  <div>
                    <div className='text-sm'>{r.action}</div>
                    <div className='text-xs text-[var(--v-text-dim)] mt-0.5'>{r.desc}</div>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge label={r.label} variant={r.color} />
                  {r.level === defaultLevel && <Badge label='active' variant='green' />}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={300}>
        <GlassCard className='p-4'>
          <div className='text-sm font-medium'>Cedar policy engine</div>
          <p className='text-xs text-[var(--v-text-dim)] mt-1'>
            Fine-grained ABAC policies via <code className='text-[var(--v-accent)]'>@vita/policy</code>. Write Cedar expressions to grant/deny specific actions per user, resource type, or time window.
          </p>
          <a href='/platform/sdk' className='text-xs text-[var(--v-accent)] hover:underline mt-2 inline-block'>Policy SDK docs →</a>
        </GlassCard>
      </FadeIn>
    </div>
  );
}
