export type Layer = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

export interface LineageRow {
  readonly id: string;
  readonly layer: Layer;
  /** IDs of the rows directly below this artifact in the lineage graph. */
  readonly parentIds: readonly string[];
}

export interface DerivationMetadata {
  readonly model: string | null;
  readonly promptVersion: string | null;
  readonly configHash: string | null;
  readonly timestamp: string | null;
}

export interface LineageDataset {
  readonly rows: readonly LineageRow[];
  /** Map artifact id -> derivation metadata for reprocessability checks. */
  readonly derivations: ReadonlyMap<string, DerivationMetadata>;
}

export interface LineageOrphan {
  readonly id: string;
  readonly layer: Layer;
  readonly reason: 'missing-parent' | 'parent-not-found' | 'incomplete-derivation';
  readonly missingParentIds?: readonly string[];
}

export interface LineageReport {
  readonly orphans: readonly LineageOrphan[];
  readonly perLayer: Readonly<Record<Layer, number>>;
  readonly totalRows: number;
  readonly passed: boolean;
}

const LAYER_ORDER: readonly Layer[] = ['L0', 'L1', 'L2', 'L3', 'L4'];

function expectedParentLayers(layer: Layer): readonly Layer[] {
  switch (layer) {
    case 'L0':
      return [];
    case 'L1':
      return ['L0'];
    case 'L2':
      return ['L1'];
    case 'L3':
      return ['L1', 'L2'];
    case 'L4':
      return ['L1', 'L2', 'L3'];
  }
}

/**
 * Scans a dataset and flags any L1+ artifact without a valid lineage chain
 * back to L0, or any derived artifact missing reprocessability metadata.
 */
export function checkLineageCompleteness(dataset: LineageDataset): LineageReport {
  const byId = new Map<string, LineageRow>();
  for (const row of dataset.rows) byId.set(row.id, row);

  const orphans: LineageOrphan[] = [];
  const perLayer: Record<Layer, number> = { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0 };

  for (const row of dataset.rows) {
    perLayer[row.layer] += 1;
    if (row.layer === 'L0') continue;

    if (!row.parentIds || row.parentIds.length === 0) {
      orphans.push({ id: row.id, layer: row.layer, reason: 'missing-parent' });
      continue;
    }

    const missing: string[] = [];
    const allowed = new Set(expectedParentLayers(row.layer));
    for (const pid of row.parentIds) {
      const parent = byId.get(pid);
      if (!parent || !allowed.has(parent.layer)) {
        missing.push(pid);
      }
    }
    if (missing.length === row.parentIds.length) {
      orphans.push({
        id: row.id,
        layer: row.layer,
        reason: 'parent-not-found',
        missingParentIds: missing,
      });
      continue;
    }

    const derivation = dataset.derivations.get(row.id);
    if (
      !derivation ||
      derivation.model === null ||
      derivation.promptVersion === null ||
      derivation.configHash === null ||
      derivation.timestamp === null
    ) {
      orphans.push({
        id: row.id,
        layer: row.layer,
        reason: 'incomplete-derivation',
      });
    }
  }

  return {
    orphans,
    perLayer,
    totalRows: dataset.rows.length,
    passed: orphans.length === 0,
  };
}

export const LAYERS = LAYER_ORDER;
