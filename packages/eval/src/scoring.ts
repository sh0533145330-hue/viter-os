import { deepEqual } from './assertions.js';

export function exactMatch(actual: unknown, expected: unknown): number {
  return deepEqual(actual, expected) ? 1 : 0;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function ngrams(tokens: readonly string[], n: number): string[] {
  if (tokens.length < n) return [];
  const grams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    grams.push(tokens.slice(i, i + n).join(' '));
  }
  return grams;
}

function countMap(items: readonly string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const item of items) {
    m.set(item, (m.get(item) ?? 0) + 1);
  }
  return m;
}

function clipOverlap(candidate: readonly string[], reference: readonly string[]): number {
  const refCounts = countMap(reference);
  const candCounts = countMap(candidate);
  let overlap = 0;
  for (const [gram, count] of candCounts) {
    const refCount = refCounts.get(gram) ?? 0;
    overlap += Math.min(count, refCount);
  }
  return overlap;
}

/**
 * BLEU-lite: geometric mean of n-gram precision (n=1..4) with a tiny smoothing
 * constant in place of NIST brevity penalty. Returns 0 if either string is empty.
 */
export function bleuLite(actual: string, expected: string): number {
  if (!actual || !expected) return 0;
  const candTokens = tokenize(actual);
  const refTokens = tokenize(expected);
  if (candTokens.length === 0 || refTokens.length === 0) return 0;

  const maxN = Math.min(4, candTokens.length, refTokens.length);
  if (maxN === 0) return 0;

  let logSum = 0;
  for (let n = 1; n <= maxN; n++) {
    const candGrams = ngrams(candTokens, n);
    const refGrams = ngrams(refTokens, n);
    if (candGrams.length === 0) {
      logSum += Math.log(1e-9);
      continue;
    }
    const overlap = clipOverlap(candGrams, refGrams);
    const precision = overlap / candGrams.length;
    logSum += Math.log(precision > 0 ? precision : 1e-9);
  }
  const avg = logSum / maxN;
  const bp =
    candTokens.length >= refTokens.length
      ? 1
      : Math.exp(1 - refTokens.length / Math.max(1, candTokens.length));
  return Math.max(0, Math.min(1, bp * Math.exp(avg)));
}

/**
 * ROUGE-lite: unigram + bigram recall, averaged.
 */
export function rougeLite(actual: string, expected: string): number {
  if (!actual || !expected) return 0;
  const candTokens = tokenize(actual);
  const refTokens = tokenize(expected);
  if (refTokens.length === 0) return 0;

  const unigramRecall = (() => {
    const overlap = clipOverlap(candTokens, refTokens);
    return overlap / refTokens.length;
  })();

  const bigramRecall = (() => {
    const refBigrams = ngrams(refTokens, 2);
    if (refBigrams.length === 0) return unigramRecall;
    const candBigrams = ngrams(candTokens, 2);
    const overlap = clipOverlap(candBigrams, refBigrams);
    return overlap / refBigrams.length;
  })();

  return Math.max(0, Math.min(1, (unigramRecall + bigramRecall) / 2));
}

/**
 * Jaccard similarity over the unigram token set. Useful as a quick semantic-ish
 * scorer when BLEU/ROUGE are too strict on word order.
 */
export function jaccardSimilarity(actual: string, expected: string): number {
  const a = new Set(tokenize(actual));
  const b = new Set(tokenize(expected));
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface LlmJudge {
  score(actual: unknown, expected: unknown, criteria: string): Promise<number>;
}

/**
 * Stub LLM judge for tests and offline runs. Returns 1.0 for string equality,
 * a token-overlap score for two strings, exact match score for everything else.
 */
export class StubLlmJudge implements LlmJudge {
  async score(actual: unknown, expected: unknown, _criteria: string): Promise<number> {
    if (typeof actual === 'string' && typeof expected === 'string') {
      if (actual === expected) return 1;
      return jaccardSimilarity(actual, expected);
    }
    return exactMatch(actual, expected);
  }
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
