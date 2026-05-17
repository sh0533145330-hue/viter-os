/**
 * Helper for resolving prompt file paths relative to this package.
 *
 * Prompts live in `src/prompts/` and ship alongside the source tree
 * (`files: ['src', 'dist']`). We use `import.meta.url` so the resolution
 * works the same when tests run against the source files and when the
 * compiled package is consumed from `dist`.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Absolute path to a prompt under `src/prompts/`. */
export function promptPath(filename: string): string {
  return resolve(HERE, 'prompts', filename);
}
