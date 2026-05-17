import { describe, it, expect } from 'vitest';
import { runCli } from './index.js';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function captureCtx(cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  return {
    cwd,
    stdout: (m: string) => out.push(m),
    stderr: (m: string) => err.push(m),
    out, err,
  };
}

describe('runCli', () => {
  it('shows help when no args given', async () => {
    const c = captureCtx('.');
    const code = await runCli([], c);
    expect(code).toBe(0);
    expect(c.out.join('')).toContain('Usage:');
  });

  it('doctor reports node version', async () => {
    const c = captureCtx('.');
    await runCli(['doctor'], c);
    expect(c.out.join('')).toContain('node:');
  });

  it('new block scaffolds files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vita-cli-cmd-'));
    try {
      const c = captureCtx(dir);
      const code = await runCli(['new', 'block', 'send-email'], c);
      expect(code).toBe(0);
      const files = await readdir(dir);
      expect(files.sort()).toEqual(['send-email.test.ts', 'send-email.ts']);
    } finally { await rm(dir, { recursive: true, force: true }); }
  });

  it('new without subcommand returns usage error', async () => {
    const c = captureCtx('.');
    const code = await runCli(['new'], c);
    expect(code).toBe(2);
    expect(c.err.join('')).toContain('usage');
  });

  it('init prints instructions', async () => {
    const c = captureCtx('.');
    const code = await runCli(['init', 'my-ext'], c);
    expect(code).toBe(0);
    expect(c.out.join('')).toContain('Initialized');
  });

  it('pack publish stubs to stdout', async () => {
    const c = captureCtx('.');
    const code = await runCli(['pack', 'publish', './my-pack'], c);
    expect(code).toBe(0);
    expect(c.out.join('')).toContain('Would sign and publish');
  });

  it('pack install requires a name', async () => {
    const c = captureCtx('.');
    const code = await runCli(['pack', 'install'], c);
    expect(code).toBe(2);
  });
});
