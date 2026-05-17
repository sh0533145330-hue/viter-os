import { Heading2, GlassCard, SectionLabel, FadeIn, Badge } from '@/app/_components/ui';
import { getWorkspaceInfo } from '@/app/actions/dashboard';
import { getSupabase, requireWorkspaceId } from '@/app/lib/clients';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const info = await getWorkspaceInfo();
  const supabase = await getSupabase();
  const wsId = await requireWorkspaceId();

  let memberCount = 0;
  if (supabase && wsId) {
    const { count } = await supabase.from('workspaces').select('id', { count: 'exact', head: true }).eq('id', wsId);
    memberCount = count ?? 1;
  }

  return (
    <div className='space-y-6'>
      <FadeIn>
        <Heading2>Team</Heading2>
        <p className='text-sm text-[var(--v-text-dim)] mt-1'>{info.timName} coordinates across all team members — each gets their own {info.tomName}.</p>
      </FadeIn>

      <FadeIn delay={100}>
        <GlassCard className='p-5'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-sm font-medium'>Workspace: {info.name || '(unnamed)'}</div>
              <div className='text-xs text-[var(--v-text-dim)] mt-0.5'>{info.onboarded ? 'Connected to Supabase' : 'Not yet connected'}</div>
            </div>
            <Badge label={info.onboarded ? 'live' : 'setup required'} variant={info.onboarded ? 'green' : 'amber'} />
          </div>
        </GlassCard>
      </FadeIn>

      <FadeIn delay={200}>
        <SectionLabel>Team architecture</SectionLabel>
        <div className='space-y-2'>
          <GlassCard className='p-4' hover>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-full bg-gradient-to-br from-[var(--v-accent)] to-[var(--v-teal)] flex items-center justify-center text-white text-xs font-bold'>{info.tomName[0]}</div>
              <div>
                <div className='text-sm font-medium'>{info.tomName} (personal)</div>
                <div className='text-xs text-[var(--v-text-dim)]'>Each team member gets their own isolated {info.tomName} instance with private context</div>
              </div>
              <Badge label='1 per user' variant='accent' />
            </div>
          </GlassCard>
          <GlassCard className='p-4' hover>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-full bg-gradient-to-br from-[var(--v-teal)] to-[var(--v-accent)] flex items-center justify-center text-white text-xs font-bold'>{info.timName[0]}</div>
              <div>
                <div className='text-sm font-medium'>{info.timName} (team)</div>
                <div className='text-xs text-[var(--v-text-dim)]'>Shared team coordinator — routes cross-team actions through each person's {info.tomName}</div>
              </div>
              <Badge label='1 per workspace' variant='teal' />
            </div>
          </GlassCard>
        </div>
      </FadeIn>

      <FadeIn delay={300}>
        <GlassCard className='p-4'>
          <div className='text-sm font-medium'>Invite team members</div>
          <p className='text-xs text-[var(--v-text-dim)] mt-1'>
            Multi-tenant user management via Supabase Auth. Each invited user gets a {info.tomName} instance scoped to the workspace.
            Auth + RLS configuration in <code className='text-[var(--v-accent)]'>@vita/auth</code>.
          </p>
        </GlassCard>
      </FadeIn>
    </div>
  );
}
