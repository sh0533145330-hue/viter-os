import { describe, it, expect } from 'vitest';
import { blockTemplate, agentTemplate, connectorTemplate, packTemplate, writeTemplate } from './scaffold.js';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('scaffold templates', () => {
  it('blockTemplate produces source and test files', () => {
    const t = blockTemplate('hello-world');
    expect(t.files.map(f => f.path).sort()).toEqual(['hello-world.test.ts', 'hello-world.ts']);
    expect(t.files[0]?.contents).toContain("defineBlock");
  });

  it('agentTemplate produces a single source file', () => {
    const t = agentTemplate('researcher');
    expect(t.files).toHaveLength(1);
    expect(t.files[0]?.contents).toContain('defineAgent');
  });

  it('connectorTemplate produces a PascalCase class', () => {
    const t = connectorTemplate('my-tool');
    expect(t.files[0]?.contents).toContain('MyToolConnector');
  });

  it('packTemplate produces a pack.json with name', () => {
    const t = packTemplate('cpa');
    const parsed = JSON.parse(t.files[0]?.contents ?? '{}');
    expect(parsed.name).toBe('cpa');
    expect(parsed.version).toBe('0.1.0');
  });

  it('writeTemplate writes files to disk', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vita-cli-test-'));
    try {
      const written = await writeTemplate(blockTemplate('foo'), dir);
      expect(written).toHaveLength(2);
      const content = await readFile(written[0]!, 'utf8');
      expect(content).toContain('foo');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
