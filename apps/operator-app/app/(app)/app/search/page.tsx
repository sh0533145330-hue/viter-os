import { listSourceKinds, listEntityTypes } from '@/app/actions/search';
import { getWorkspaceInfo } from '@/app/actions/dashboard';
import { SearchClient } from './search-client';

export const dynamic = 'force-dynamic';

export default async function SearchPage() {
  const [sourceKinds, entityTypes, info] = await Promise.all([
    listSourceKinds(),
    listEntityTypes(),
    getWorkspaceInfo(),
  ]);
  return <SearchClient sourceKinds={sourceKinds} entityTypes={entityTypes} tomName={info.tomName} onboarded={info.onboarded} />;
}
