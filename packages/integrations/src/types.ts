export type SourceTier = 'nango' | 'rest' | 'custom';

export interface IngestedEntity {
  externalId: string;
  sourceKind: string;
  type: string;
  title: string;
  body?: string;
  url?: string;
  author?: string;
  createdAtExternal?: string;
  updatedAtExternal?: string;
  metadata: Record<string, unknown>;
}

export interface SyncResult {
  entitiesUpserted: number;
  errors: string[];
  cursor?: string;
}

export interface ConnectorTestResult {
  ok: boolean;
  message: string;
  identity?: string;
}

export interface SourceConfig {
  tier: SourceTier;
  kind: string;
  label?: string;
  nango?: { provider: string; connectionId: string };
  rest?: {
    baseUrl: string;
    listPath: string;
    listJsonPath: string;
    idField: string;
    titleField: string;
    bodyField?: string;
    urlField?: string;
    updatedAtField?: string;
    authHeader: string;
    authValue: string;
    type: string;
  };
}

