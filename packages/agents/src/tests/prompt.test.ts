import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  clearPromptCache,
  computePromptHash,
  loadPrompt,
  registerPrompt,
  renderPrompt,
} from '../prompt.js';

describe('prompt loader', () => {
  it('renders variables and computes a stable hash', () => {
    const tpl = registerPrompt({
      id: 'inline:greet',
      body: 'Hello, {{ name }}! You have {{ count }} messages.',
      variables: ['name', 'count'],
    });
    const r1 = renderPrompt(tpl, { name: 'Alex', count: 3 });
    expect(r1.text).toBe('Hello, Alex! You have 3 messages.');
    const r2 = renderPrompt(tpl, { name: 'Alex', count: 3 });
    expect(r2.hash).toBe(r1.hash);
    const r3 = renderPrompt(tpl, { name: 'Alex', count: 4 });
    expect(r3.hash).not.toBe(r1.hash);
  });

  it('loads from disk, caches, and supports baseDir', () => {
    clearPromptCache();
    const dir = mkdtempSync(join(tmpdir(), 'vita-prompt-'));
    const file = join(dir, 'sample.md');
    writeFileSync(file, 'Body for {{ who }}.', 'utf8');
    const a = loadPrompt('sample.md', dir);
    expect(a.body).toContain('Body for');
    expect(a.variables).toEqual(['who']);
    const b = loadPrompt(file);
    expect(b.id).toBe(a.id);
  });

  it('treats null/undefined vars as empty string', () => {
    const tpl = registerPrompt({
      id: 'inline:nullish',
      body: 'X={{ a }};Y={{ b }};',
      variables: ['a', 'b'],
    });
    const r = renderPrompt(tpl, { a: undefined, b: 'ok' });
    expect(r.text).toBe('X=;Y=ok;');
  });

  it('hashes are stable across key order in vars', () => {
    const body = 'x={{ x }} y={{ y }}';
    const h1 = computePromptHash(body, { x: 1, y: 2 });
    const h2 = computePromptHash(body, { y: 2, x: 1 });
    expect(h1).toBe(h2);
  });
});
