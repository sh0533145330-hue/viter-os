#!/usr/bin/env tsx
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '..');

const result = spawnSync(
  process.execPath,
  [resolve(pkgRoot, 'node_modules/drizzle-kit/bin.cjs'), 'generate', '--config=drizzle.config.ts'],
  { cwd: pkgRoot, stdio: 'inherit', env: process.env },
);

process.exit(result.status ?? 1);
