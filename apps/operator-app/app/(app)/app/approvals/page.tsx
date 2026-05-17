import { listPendingApprovals } from '@/app/actions/approvals';
import { getWorkspaceInfo } from '@/app/actions/dashboard';
import { ApprovalsClient } from './approvals-client';

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  const [approvals, info] = await Promise.all([listPendingApprovals(), getWorkspaceInfo()]);
  return <ApprovalsClient initialApprovals={approvals} tomName={info.tomName} onboarded={info.onboarded} />;
}
