import { listSources } from '@/app/actions/sources';
import { getWorkspaceInfo } from '@/app/actions/dashboard';
import { SourcesClient } from './sources-client';

export const dynamic = 'force-dynamic';

export default async function ConnectorsPage() {
  const [sources, info] = await Promise.all([listSources(), getWorkspaceInfo()]);
  return <SourcesClient initialSources={sources} onboarded={info.onboarded} />;
}
