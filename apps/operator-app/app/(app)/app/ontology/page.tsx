import { getEntityStats, listEntities } from '@/app/actions/ontology';
import { getWorkspaceInfo } from '@/app/actions/dashboard';
import { OntologyClient } from './ontology-client';

export const dynamic = 'force-dynamic';

export default async function OntologyPage() {
  const [stats, entities, info] = await Promise.all([getEntityStats(), listEntities({ limit: 30 }), getWorkspaceInfo()]);
  return <OntologyClient initialStats={stats} initialEntities={entities} onboarded={info.onboarded} />;
}
