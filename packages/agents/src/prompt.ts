/**
 * Prompt template loader + renderer.
 *
 * Templates may be provided as a relative file path (resolved against
 * the caller's directory) or as an inline `PromptTemplate` object.
 * Loaded templates are cached so the same file is parsed at most once
 * per process.
 *
 * Variables are interpolated with a tiny Mustache-style replacement —
 * `{{ name }}` → `vars.name`. No conditionals, no loops; agents that
 * need control flow should build their prompt body programmatically.
 *
 * Every render returns a stable sha256 hash over the prompt body and
 * the sorted variable payload so audit log entries (`prompt_hash`)
 * remain reproducible.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

/** A parsed prompt template ready for rendering. */
export interface PromptTemplate {
  readonly id: string;
  readonly body: string;
  readonly variables: readonly string[];
}

/** Result of rendering a template with concrete variables. */
export interface RenderedPrompt {
  readonly promptId: string;
  readonly text: string;
  readonly hash: string;
}

const VAR_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
const cache = new Map<string, PromptTemplate>();

function extractVariables(body: string): readonly string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(VAR_PATTERN)) {
    const name = match[1];
    if (name) found.add(name);
  }
  return Array.from(found).sort();
}

/** Manually register a `PromptTemplate` in the loader cache. */
export function registerPrompt(tpl: PromptTemplate): PromptTemplate {
  cache.set(tpl.id, tpl);
  return tpl;
}

/** Drop a cached prompt — used by tests and hot-reload paths. */
export function clearPromptCache(id?: string): void {
  if (id === undefined) cache.clear();
  else cache.delete(id);
}

/**
 * Load a prompt from disk or pass through an inline template.
 *
 * @param ref Either a `PromptTemplate` object (used as-is, then
 *   cached by `id`) or a string path. When a path is given, `baseDir`
 *   may be supplied so relative paths resolve next to the caller's
 *   source file (typically `fileURLToPath(new URL('.', import.meta.url))`).
 */
export function loadPrompt(ref: string | PromptTemplate, baseDir?: string): PromptTemplate {
  if (typeof ref !== 'string') {
    cache.set(ref.id, ref);
    return ref;
  }
  const absolute = baseDir ? resolvePath(baseDir, ref) : resolvePath(ref);
  const cached = cache.get(absolute);
  if (cached) return cached;
  const body = readFileSync(absolute, 'utf8');
  const tpl: PromptTemplate = {
    id: absolute,
    body,
    variables: extractVariables(body),
  };
  cache.set(absolute, tpl);
  return tpl;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const parts = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  return `{${parts.join(',')}}`;
}

/**
 * Compute the canonical prompt audit hash for a body + variable map.
 *
 * The hash includes the prompt body and the sorted JSON encoding of
 * the variables so log entries remain stable across processes.
 */
export function computePromptHash(body: string, vars: Record<string, unknown>): string {
  const h = createHash('sha256');
  h.update(body);
  h.update('\u0000');
  h.update(stableStringify(vars));
  return h.digest('hex');
}

/** Render a template, substituting `{{ name }}` placeholders. */
export function renderPrompt(
  tpl: PromptTemplate,
  vars: Record<string, unknown> = {},
): RenderedPrompt {
  const text = tpl.body.replace(VAR_PATTERN, (_match, name: string) => {
    const value = vars[name];
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  });
  return {
    promptId: tpl.id,
    text,
    hash: computePromptHash(tpl.body, vars),
  };
}
