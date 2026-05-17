import { describe, expect, it } from 'vitest';
import {
  agencies,
  agentDefinitions,
  agentRuns,
  agentTuningRuns,
  anonymizationAudit,
  apiKeys,
  approvalActions,
  approvals,
  auditLog,
  billingConfigs,
  boards,
  brandIdentities,
  connectorInstances,
  costMeters,
  dashboards,
  derivationRuns,
  encryptionKeys,
  entities,
  entityActions,
  entityLinks,
  inboxItems,
  keyResults,
  l0Artifacts,
  l0Chunks,
  l1Artifacts,
  labelOverrides,
  libraryItems,
  lineageEdges,
  linkTypes,
  memberships,
  mindEvents,
  mindItems,
  mindProposals,
  objectiveUpdates,
  objectives,
  objectTypes,
  packDeployments,
  packVersions,
  packs,
  platforms,
  propertyTypes,
  serviceAccounts,
  skillCalls,
  skillDefinitions,
  sourceHealth,
  syncErrors,
  syncJobs,
  syncRuns,
  timMinds,
  tomBoundaryActs,
  tomMinds,
  trainingPairs,
  users,
  viewCaches,
  views,
  workflowDefinitions,
  workflowEvents,
  workflowRuns,
  workflowSteps,
  workspaces,
  actionTypes,
} from './schema/index.js';
import { getTableConfig } from 'drizzle-orm/pg-core';

const ALL = [
  platforms,
  agencies,
  workspaces,
  users,
  memberships,
  l0Artifacts,
  l0Chunks,
  l1Artifacts,
  objectTypes,
  linkTypes,
  actionTypes,
  propertyTypes,
  entities,
  entityLinks,
  entityActions,
  libraryItems,
  packs,
  packVersions,
  packDeployments,
  labelOverrides,
  tomMinds,
  timMinds,
  mindItems,
  mindProposals,
  mindEvents,
  objectives,
  keyResults,
  objectiveUpdates,
  workflowDefinitions,
  workflowRuns,
  workflowSteps,
  workflowEvents,
  skillDefinitions,
  skillCalls,
  views,
  dashboards,
  boards,
  viewCaches,
  lineageEdges,
  derivationRuns,
  inboxItems,
  approvals,
  approvalActions,
  tomBoundaryActs,
  agentDefinitions,
  agentRuns,
  trainingPairs,
  agentTuningRuns,
  connectorInstances,
  syncJobs,
  syncRuns,
  syncErrors,
  auditLog,
  costMeters,
  sourceHealth,
  anonymizationAudit,
  encryptionKeys,
  apiKeys,
  serviceAccounts,
  billingConfigs,
  brandIdentities,
];

const WORKSPACE_SCOPED = [
  l0Artifacts,
  l0Chunks,
  l1Artifacts,
  entities,
  entityLinks,
  entityActions,
  packDeployments,
  tomMinds,
  timMinds,
  mindItems,
  mindProposals,
  mindEvents,
  objectives,
  workflowRuns,
  skillCalls,
  views,
  dashboards,
  boards,
  viewCaches,
  lineageEdges,
  derivationRuns,
  inboxItems,
  approvals,
  tomBoundaryActs,
  agentRuns,
  trainingPairs,
  agentTuningRuns,
  connectorInstances,
  costMeters,
  anonymizationAudit,
];

describe('substrate schema shape', () => {
  it('exports every expected table', () => {
    expect(ALL.length).toBeGreaterThanOrEqual(55);
    for (const table of ALL) {
      const cfg = getTableConfig(table);
      expect(cfg.name).toBeTypeOf('string');
      expect(cfg.name.length).toBeGreaterThan(0);
    }
  });

  it('multi-tenant tables carry a workspace_id column', () => {
    for (const table of WORKSPACE_SCOPED) {
      const cfg = getTableConfig(table);
      const hasWorkspace = cfg.columns.some((c) => c.name === 'workspace_id');
      expect(hasWorkspace, `${cfg.name} must have workspace_id`).toBe(true);
    }
  });

  it('every table exposes created_at', () => {
    const skipCreatedAt = new Set<string>([]);
    for (const table of ALL) {
      const cfg = getTableConfig(table);
      if (skipCreatedAt.has(cfg.name)) continue;
      const hasCreated = cfg.columns.some((c) => c.name === 'created_at');
      expect(hasCreated, `${cfg.name} must have created_at`).toBe(true);
    }
  });

  it('soft-delete-eligible tables expose deleted_at', () => {
    const softDeletable = [
      l0Artifacts,
      l1Artifacts,
      entities,
      entityLinks,
      objectives,
      keyResults,
      inboxItems,
      mindItems,
      workspaces,
      agencies,
      platforms,
      users,
    ];
    for (const table of softDeletable) {
      const cfg = getTableConfig(table);
      const hasDeleted = cfg.columns.some((c) => c.name === 'deleted_at');
      expect(hasDeleted, `${cfg.name} should have deleted_at`).toBe(true);
    }
  });

  it.skipIf(!process.env.DATABASE_URL)('connects to DATABASE_URL when provided', async () => {
    const { createDb } = await import('./client.js');
    const url = process.env.DATABASE_URL ?? '';
    const handle = createDb(url, { max: 1 });
    try {
      const result = await handle.sql`select 1 as ok`;
      expect(result[0]?.ok).toBe(1);
    } finally {
      await handle.close();
    }
  });
});
