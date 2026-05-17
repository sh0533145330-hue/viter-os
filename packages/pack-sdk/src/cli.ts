/**
 * `@vita/pack-sdk` — CLI helpers for pack commands.
 *
 * Provides lightweight argument parsing for CLI tools that invoke
 * pack operations. Uses `process.argv` parsing (no commander/yargs
 * dependency) so it stays zero-dependency for the SDK.
 *
 * Usage (from a CLI entry point):
 *   import { parsePackArgs, cliPublish, cliDeploy } from '@vita/pack-sdk/cli';
 */

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

export interface ParsedArgs {
  command: string;
  flags: Record<string, string | boolean>;
  positional: string[];
}

/**
 * Parse `process.argv` into a structured command object.
 *
 * Recognizes:
 * - Flags: `--flag`, `--flag=value`, `--flag value`
 * - Positional: everything else (after the node + script path)
 */
export function parsePackArgs(argv: string[] = process.argv): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  let command = '';
  let i = 2; // Skip node and script path

  while (i < argv.length) {
    const arg = argv[i]!;

    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx >= 0) {
        const key = arg.slice(2, eqIdx);
        const value = arg.slice(eqIdx + 1);
        flags[key] = value;
      } else {
        const key = arg.slice(2);
        // Check if next arg is a value (not starting with --)
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('--')) {
          flags[key] = next;
          i++; // consume the value
        } else {
          flags[key] = true;
        }
      }
    } else {
      if (!command) {
        command = arg;
      } else {
        positional.push(arg);
      }
    }
    i++;
  }

  return { command, flags, positional };
}

// ---------------------------------------------------------------------------
// CLI action stubs
// ---------------------------------------------------------------------------

/**
 * CLI entry point for `vita pack publish`.
 *
 * Expects `--manifest=<path>` or reads from stdin.
 * Returns a JSON result to stdout.
 */
export async function cliPublish(
  _deps: { logger: { info: (msg: string) => void }; db?: unknown },
): Promise<void> {
  const args = parsePackArgs();
  const manifestPath = args.flags['manifest'] as string | undefined;

  if (!manifestPath) {
    console.error('Error: --manifest=<path> is required');
    process.exit(1);
  }

  _deps.logger.info(`Publish: reading manifest from ${manifestPath}`);

  // Stub: actual file I/O left to the runtime consumer
  console.log(
    JSON.stringify({
      status: 'stub',
      message: 'CLI publish: use the publishPack() API directly',
      manifestPath,
    }),
  );
}

/**
 * CLI entry point for `vita pack deploy`.
 *
 * Expects `--workspace=<id> --pack-version=<id>`.
 */
export async function cliDeploy(
  _deps: { logger: { info: (msg: string) => void }; db?: unknown },
): Promise<void> {
  const args = parsePackArgs();
  const workspaceId = args.flags['workspace'] as string | undefined;
  const packVersionId = args.flags['pack-version'] as string | undefined;

  if (!workspaceId || !packVersionId) {
    console.error(
      'Error: --workspace=<id> and --pack-version=<id> are required',
    );
    process.exit(1);
  }

  _deps.logger.info(
    `Deploy: workspace=${workspaceId} pack-version=${packVersionId}`,
  );

  console.log(
    JSON.stringify({
      status: 'stub',
      message: 'CLI deploy: use the deployPack() API directly',
      workspaceId,
      packVersionId,
    }),
  );
}
