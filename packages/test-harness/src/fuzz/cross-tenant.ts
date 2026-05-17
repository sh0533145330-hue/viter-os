export interface Row {
  readonly workspace_id: string;
  readonly [key: string]: unknown;
}

/**
 * Pluggable query function: given a table, a workspace ("tenant") performing
 * the read, and a query expression, returns the rows the query would surface.
 * The fuzzer asserts the returned rows all carry the caller's workspace_id.
 */
export type QueryFn = (
  table: string,
  callerWorkspaceId: string,
  query: Record<string, unknown>,
) => Promise<readonly Row[]> | readonly Row[];

export interface CrossTenantFuzzConfig {
  readonly tables: readonly string[];
  readonly workspaces: readonly string[];
  readonly queryGenerator?: (table: string) => Record<string, unknown>;
  readonly variantsPerEndpoint?: number;
}

export interface CrossTenantLeak {
  readonly table: string;
  readonly callerWorkspaceId: string;
  readonly leakedRow: Row;
  readonly query: Record<string, unknown>;
}

export interface CrossTenantFuzzReport {
  readonly leaks: readonly CrossTenantLeak[];
  readonly tablesChecked: number;
  readonly queriesRan: number;
  readonly passed: boolean;
}

export class CrossTenantFuzz {
  private readonly config: Required<CrossTenantFuzzConfig>;

  constructor(config: CrossTenantFuzzConfig) {
    if (config.workspaces.length < 2) {
      throw new Error('CrossTenantFuzz requires at least 2 workspaces');
    }
    if (config.tables.length === 0) {
      throw new Error('CrossTenantFuzz requires at least 1 table');
    }
    this.config = {
      tables: config.tables,
      workspaces: config.workspaces,
      queryGenerator: config.queryGenerator ?? (() => ({})),
      variantsPerEndpoint: config.variantsPerEndpoint ?? 8,
    };
  }

  async run(query: QueryFn): Promise<CrossTenantFuzzReport> {
    const leaks: CrossTenantLeak[] = [];
    let queriesRan = 0;

    for (const table of this.config.tables) {
      for (const caller of this.config.workspaces) {
        for (let v = 0; v < this.config.variantsPerEndpoint; v++) {
          const q = this.config.queryGenerator(table);
          const rows = await query(table, caller, q);
          queriesRan++;
          for (const row of rows) {
            if (row.workspace_id !== caller) {
              leaks.push({
                table,
                callerWorkspaceId: caller,
                leakedRow: row,
                query: q,
              });
            }
          }
        }
      }
    }

    return {
      leaks,
      tablesChecked: this.config.tables.length,
      queriesRan,
      passed: leaks.length === 0,
    };
  }
}
