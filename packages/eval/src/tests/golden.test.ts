import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GoldenSetLoader } from '../golden.js';

describe('GoldenSetLoader', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(path.join(tmpdir(), 'golden-'));
  });

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it('parses inline JSON', () => {
    const loader = new GoldenSetLoader();
    const cases = loader.parse(
      JSON.stringify({
        suite: 'demo',
        cases: [{ id: 'g1', input: { q: 'hi' }, expected: 'hi', tags: ['smoke'] }],
      }),
    );
    expect(cases).toHaveLength(1);
    expect(cases[0]?.id).toBe('g1');
  });

  it('rejects invalid JSON', () => {
    const loader = new GoldenSetLoader();
    expect(() => loader.parse('not json')).toThrow(/Failed to parse/);
  });

  it('rejects cases without ids', () => {
    const loader = new GoldenSetLoader();
    expect(() => loader.parse(JSON.stringify({ cases: [{ input: 1 }] }))).toThrow();
  });

  it('loads a single file from disk', async () => {
    const file = path.join(tmp, 'set.json');
    await writeFile(
      file,
      JSON.stringify({
        cases: [
          { id: 'a', input: 1 },
          { id: 'b', input: 2 },
        ],
      }),
    );
    const loader = new GoldenSetLoader();
    const cases = await loader.loadFile(file);
    expect(cases).toHaveLength(2);
    expect(loader.all()).toHaveLength(2);
  });

  it('loads all JSON files in a directory', async () => {
    await writeFile(
      path.join(tmp, 'a.json'),
      JSON.stringify({ cases: [{ id: 'a', input: 1, tags: ['smoke'] }] }),
    );
    await writeFile(
      path.join(tmp, 'b.json'),
      JSON.stringify({ cases: [{ id: 'b', input: 2, tags: ['regression'] }] }),
    );
    await writeFile(path.join(tmp, 'ignore.txt'), 'nope');

    const loader = new GoldenSetLoader();
    const cases = await loader.loadDirectory(tmp);
    expect(cases).toHaveLength(2);
  });

  it('filters by tag when loading a directory', async () => {
    await writeFile(
      path.join(tmp, 'a.json'),
      JSON.stringify({
        cases: [
          { id: 'a', input: 1, tags: ['smoke'] },
          { id: 'b', input: 2, tags: ['regression'] },
        ],
      }),
    );
    const loader = new GoldenSetLoader();
    const cases = await loader.loadDirectory(tmp, { tags: ['regression'] });
    expect(cases).toHaveLength(1);
    expect(cases[0]?.id).toBe('b');
  });

  it('byTag and clear behave correctly', () => {
    const loader = new GoldenSetLoader();
    loader.parse(
      JSON.stringify({
        cases: [
          { id: 'a', input: 1, tags: ['x'] },
          { id: 'b', input: 2, tags: ['y'] },
        ],
      }),
    );
    expect(loader.byTag('x')).toHaveLength(1);
    expect(loader.byTag('y')).toHaveLength(1);
    expect(loader.byTag('z')).toHaveLength(0);
    loader.clear();
    expect(loader.all()).toHaveLength(0);
  });
});
