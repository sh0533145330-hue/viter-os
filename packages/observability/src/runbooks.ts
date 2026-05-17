import type { Runbook } from './types.js';

export type { Runbook, RunbookStep } from './types.js';

export const RUNBOOKS: Runbook[] = [
  {
    key: 'cross_tenant_leak_suspected',
    title: 'Cross-tenant data leak suspected',
    severity: 'critical',
    triggers: ['security_violation', 'error_spike'],
    steps: [
      { order: 1, description: 'Confirm scope: identify workspaces and endpoints involved', command: 'kubectl logs -n vita-os -l app=api --since=15m | grep workspace_id' },
      { order: 2, description: 'Disable affected agent or workflow via feature flag', command: 'flag set tenancy.guard.locked=true' },
      { order: 3, description: 'Notify Security on-call and Privacy lead' },
      { order: 4, description: 'Snapshot audit_log rows for affected workspaces' },
      { order: 5, description: 'Verify row-level security policies via cross-tenant fuzz test', command: 'pnpm -F @vita/db test:rls' },
      { order: 6, description: 'Notify affected workspace admins via incident comms template' },
      { order: 7, description: 'Open post-incident review ticket in Linear' },
    ],
    owner: 'security',
  },
  {
    key: 'anonymization_failure',
    title: 'PII detected in cross-tenant output',
    severity: 'critical',
    triggers: ['anonymization_failure'],
    steps: [
      { order: 1, description: 'Disable affected pack via library feature flag' },
      { order: 2, description: 'Identify failing pattern set (standard / strict / healthcare)' },
      { order: 3, description: 'Inspect anonymization_audit rows for the affected dataset' },
      { order: 4, description: 'Roll back to previous redactor strictness if regression confirmed' },
      { order: 5, description: 'Notify Privacy lead and affected workspace admins' },
      { order: 6, description: 'Add reproducing test to packages/anonymization/tests/' },
    ],
    owner: 'privacy',
  },
  {
    key: 'tom_auto_action_gone_wrong',
    title: 'Tom auto-action gone wrong (boundary act without proper approval)',
    severity: 'critical',
    triggers: ['security_violation'],
    steps: [
      { order: 1, description: 'Halt tom worker', command: 'kubectl scale deploy/tom-worker --replicas=0' },
      { order: 2, description: 'Identify the boundary act IDs that fired without approval' },
      { order: 3, description: 'Issue compensating action (recall email, send correction, etc.)' },
      { order: 4, description: 'Notify impacted parties via the workspace inbox' },
      { order: 5, description: 'Open Linear ticket with reproduction steps' },
      { order: 6, description: 'Resume tom worker after approval policy patch deploys' },
    ],
    owner: 'agents',
  },
  {
    key: 'cost_circuit_breaker_tripped',
    title: 'Cost circuit breaker tripped',
    severity: 'error',
    triggers: ['budget_breach', 'budget_breach_approaching'],
    steps: [
      { order: 1, description: 'Identify the workspace and meter that breached' },
      { order: 2, description: 'Inspect cost_meters for unusual usage patterns (top 5 actions)' },
      { order: 3, description: 'Notify workspace admin via in-app banner + email' },
      { order: 4, description: 'If runaway agent loop, kill the run', command: 'pnpm scripts/cancel-run.ts <run_id>' },
      { order: 5, description: 'Apply temporary spend cap', command: 'pnpm scripts/set-spend-cap.ts <workspace_id>' },
      { order: 6, description: 'Confirm circuit breaker reset behavior' },
    ],
    owner: 'platform',
  },
  {
    key: 'voice_provider_outage',
    title: 'Voice provider outage (Vapi down)',
    severity: 'error',
    triggers: [],
    steps: [
      { order: 1, description: 'Confirm provider status at status.vapi.ai' },
      { order: 2, description: 'Flip voice.provider.fallback flag to backup provider' },
      { order: 3, description: 'Pause inbound call handling if all providers degraded' },
      { order: 4, description: 'Notify affected workspaces via status page' },
      { order: 5, description: 'Restore primary after vendor green' },
    ],
    owner: 'platform',
  },
  {
    key: 'meilisearch_index_corruption',
    title: 'Meilisearch index corruption',
    severity: 'error',
    triggers: [],
    steps: [
      { order: 1, description: 'Pause search workers', command: 'pnpm scripts/pause-search.ts' },
      { order: 2, description: 'Take backup of current index snapshot' },
      { order: 3, description: 'Re-index from L1 artifacts', command: 'pnpm scripts/reindex.ts --since=24h' },
      { order: 4, description: 'Verify search results parity with previous snapshot' },
      { order: 5, description: 'Resume search workers' },
    ],
    owner: 'platform',
  },
  {
    key: 'bullmq_redis_queue_backlog',
    title: 'BullMQ / Redis queue backlog',
    severity: 'error',
    triggers: ['queue_backlog'],
    steps: [
      { order: 1, description: 'Identify the queue with backlog', command: 'pnpm scripts/queue-stats.ts' },
      { order: 2, description: 'Scale up consumers', command: 'kubectl scale deploy/worker --replicas=10' },
      { order: 3, description: 'Inspect failed jobs for poison pills' },
      { order: 4, description: 'Drop or quarantine poison messages' },
      { order: 5, description: 'Monitor depth until under 1000' },
      { order: 6, description: 'Scale down consumers once cleared' },
    ],
    owner: 'platform',
  },
  {
    key: 'llm_provider_rate_limit',
    title: 'LLM provider rate-limit / outage',
    severity: 'error',
    triggers: [],
    steps: [
      { order: 1, description: 'Confirm provider status' },
      { order: 2, description: 'Flip llm.provider.routing to secondary provider' },
      { order: 3, description: 'Pause non-critical agent runs (low priority queues)' },
      { order: 4, description: 'Notify workspace admins of degraded mode' },
      { order: 5, description: 'Restore primary after vendor green' },
    ],
    owner: 'platform',
  },
  {
    key: 'connector_auth_expiry_cascade',
    title: 'Connector auth expiry cascade',
    severity: 'warning',
    triggers: [],
    steps: [
      { order: 1, description: 'Identify affected connector_instances rows with errored status' },
      { order: 2, description: 'Notify workspace admins to re-auth via inbox card' },
      { order: 3, description: 'Pause derived sync jobs to avoid retry storms' },
      { order: 4, description: 'Track re-auth completion; resume sync jobs as workspaces recover' },
    ],
    owner: 'connectors',
  },
  {
    key: 'agent_eval_drift_detected',
    title: 'Agent eval drift detected',
    severity: 'warning',
    triggers: ['eval_drift', 'agent_confidence_crash'],
    steps: [
      { order: 1, description: 'Inspect eval_runs nDCG@3 timeline for the agent' },
      { order: 2, description: 'Identify recent prompt or tool changes (git log packages/agents)' },
      { order: 3, description: 'Roll back to previous agent_definitions row if regression confirmed' },
      { order: 4, description: 'Open eval ticket with reproducing input set' },
      { order: 5, description: 'Re-run eval gate to confirm restoration' },
    ],
    owner: 'agents',
  },
];

export function getRunbook(key: string): Runbook | undefined {
  return RUNBOOKS.find((r) => r.key === key);
}

const RUNBOOK_BASE_URL = process.env.RUNBOOK_BASE_URL ?? 'https://runbooks.vitaos.app';

export function runbookUrl(key: string): string {
  return `${RUNBOOK_BASE_URL.replace(/\/$/, '')}/${key}`;
}

export function listRunbooks(): Runbook[] {
  return RUNBOOKS;
}
