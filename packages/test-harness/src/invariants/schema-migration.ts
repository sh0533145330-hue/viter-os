export interface MigrationFile {
  readonly name: string;
  readonly up: string;
  readonly down: string;
}

export interface MigrationViolation {
  readonly migration: string;
  readonly rule: string;
  readonly detail: string;
}

export interface MigrationReport {
  readonly violations: readonly MigrationViolation[];
  readonly migrationsChecked: number;
  readonly passed: boolean;
}

const NAME_RE = /^\d{4,}_[a-z0-9_]+\.sql$/i;

/**
 * Validates migration files against zero-downtime rules:
 *   - file name matches `<timestamp>_<description>.sql`
 *   - both up and down are non-empty
 *   - no DROP COLUMN without prior SET UNUSED
 *   - no DROP TABLE without rename grace
 *   - no NOT NULL constraint added without DEFAULT
 *   - no ALTER COLUMN TYPE that rewrites the table
 *   - any CREATE TABLE adds workspace_id + an RLS policy
 */
export function checkMigration(file: MigrationFile): readonly MigrationViolation[] {
  const violations: MigrationViolation[] = [];
  const up = file.up;
  const upLower = up.toLowerCase();

  if (!NAME_RE.test(file.name)) {
    violations.push({
      migration: file.name,
      rule: 'naming',
      detail: 'Migration name must match <timestamp>_<description>.sql',
    });
  }
  if (file.up.trim() === '') {
    violations.push({ migration: file.name, rule: 'empty-up', detail: 'up SQL is empty' });
  }
  if (file.down.trim() === '') {
    violations.push({ migration: file.name, rule: 'empty-down', detail: 'down SQL is empty' });
  }

  if (/\bdrop\s+column\b/i.test(up) && !/set\s+unused/i.test(up)) {
    violations.push({
      migration: file.name,
      rule: 'drop-column-grace',
      detail: 'DROP COLUMN requires prior SET UNUSED grace period',
    });
  }
  if (/\bdrop\s+table\b/i.test(up) && !/rename\s+to\s+\w*_deprecated/i.test(up)) {
    violations.push({
      migration: file.name,
      rule: 'drop-table-grace',
      detail: 'DROP TABLE requires RENAME TO *_deprecated_ grace period',
    });
  }
  if (/\bnot\s+null\b/i.test(up) && /add\s+column/i.test(up) && !/default\b/i.test(up)) {
    violations.push({
      migration: file.name,
      rule: 'not-null-default',
      detail: 'Adding NOT NULL column requires DEFAULT or staged backfill',
    });
  }
  if (/\balter\s+column\b[\s\S]*\btype\b/i.test(up)) {
    violations.push({
      migration: file.name,
      rule: 'alter-column-type',
      detail: 'ALTER COLUMN TYPE rewrites the table; use add+backfill+drop pattern',
    });
  }

  const createTableMatches = upLower.match(/create\s+table\s+(if\s+not\s+exists\s+)?[\w."]+/g);
  if (createTableMatches) {
    if (!/workspace_id/i.test(up)) {
      violations.push({
        migration: file.name,
        rule: 'workspace-id-required',
        detail: 'CREATE TABLE must include workspace_id column for tenant isolation',
      });
    }
    if (!/create\s+policy/i.test(up)) {
      violations.push({
        migration: file.name,
        rule: 'rls-policy-required',
        detail: 'CREATE TABLE must be paired with at least one CREATE POLICY',
      });
    }
  }

  return violations;
}

/** Runs `checkMigration` over a list of migrations and aggregates results. */
export function checkMigrations(files: readonly MigrationFile[]): MigrationReport {
  const violations: MigrationViolation[] = [];
  for (const f of files) {
    violations.push(...checkMigration(f));
  }
  return {
    violations,
    migrationsChecked: files.length,
    passed: violations.length === 0,
  };
}
