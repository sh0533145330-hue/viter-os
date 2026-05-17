/**
 * Search evaluation metrics — NDCG@k, recall@k, precision@k, MRR.
 *
 * These are pure functions over ranked lists. They are used by the eval
 * suite (T-EP13-009) and by CI gates on hybrid search quality (T-EP13-005).
 */

function clampK(k: number, n: number): number {
  if (!Number.isFinite(k) || k <= 0) return 0;
  return Math.min(Math.floor(k), n);
}

function dcg(relevances: number[], k: number): number {
  const limit = clampK(k, relevances.length);
  let sum = 0;
  for (let i = 0; i < limit; i++) {
    const rel = relevances[i] ?? 0;
    sum += (2 ** rel - 1) / Math.log2(i + 2);
  }
  return sum;
}

/**
 * Normalised Discounted Cumulative Gain at rank k.
 *
 * `actual` is the ranked list of document IDs returned by the system.
 * `ideal` is the relevance-ordered list of document IDs (best first).
 *
 * Each document's relevance is scored by its position in `ideal`:
 *   ideal[0] → relevance = len(ideal), decreasing linearly to 1.
 * Documents not in `ideal` have relevance 0.
 */
export function ndcgAtK(actual: string[], ideal: string[], k: number): number {
  if (ideal.length === 0) return 0;
  const limit = clampK(k, Math.max(actual.length, ideal.length));
  if (limit === 0) return 0;

  const relMap = new Map<string, number>();
  ideal.forEach((id, idx) => {
    relMap.set(id, ideal.length - idx);
  });

  const actualRels = actual.slice(0, limit).map((id) => relMap.get(id) ?? 0);
  const idealRels = [...relMap.values()].sort((a, b) => b - a).slice(0, limit);

  const actualDcg = dcg(actualRels, limit);
  const idealDcg = dcg(idealRels, limit);
  if (idealDcg === 0) return 0;
  return Math.max(0, Math.min(1, actualDcg / idealDcg));
}

export function recallAtK(actual: string[], relevant: string[], k: number): number {
  if (relevant.length === 0) return 0;
  const limit = clampK(k, actual.length);
  if (limit === 0) return 0;
  const topK = new Set(actual.slice(0, limit));
  const relevantSet = new Set(relevant);
  let hits = 0;
  for (const r of relevantSet) {
    if (topK.has(r)) hits++;
  }
  return hits / relevantSet.size;
}

export function precisionAtK(actual: string[], relevant: string[], k: number): number {
  const limit = clampK(k, actual.length);
  if (limit === 0) return 0;
  const relevantSet = new Set(relevant);
  let hits = 0;
  for (let i = 0; i < limit; i++) {
    const id = actual[i];
    if (id !== undefined && relevantSet.has(id)) hits++;
  }
  return hits / limit;
}

/**
 * Mean reciprocal rank. Each entry is the 1-indexed rank of the first
 * relevant item for a query (use 0 if no relevant item was retrieved).
 */
export function mrr(rankings: number[]): number {
  if (rankings.length === 0) return 0;
  let total = 0;
  for (const r of rankings) {
    if (r > 0 && Number.isFinite(r)) total += 1 / r;
  }
  return total / rankings.length;
}

export interface QueryEval {
  actual: string[];
  relevant: string[];
  ideal?: string[];
}

export interface EvalReport {
  ndcg10: number;
  recall10: number;
  precision10: number;
  mrr: number;
  queryCount: number;
}

/**
 * Aggregate eval metrics across a batch of queries. Useful for golden-set
 * evaluation runs.
 */
export function aggregateEval(queries: QueryEval[]): EvalReport {
  if (queries.length === 0) {
    return { ndcg10: 0, recall10: 0, precision10: 0, mrr: 0, queryCount: 0 };
  }
  let ndcgSum = 0;
  let recallSum = 0;
  let precisionSum = 0;
  const ranks: number[] = [];

  for (const q of queries) {
    const ideal = q.ideal ?? q.relevant;
    ndcgSum += ndcgAtK(q.actual, ideal, 10);
    recallSum += recallAtK(q.actual, q.relevant, 10);
    precisionSum += precisionAtK(q.actual, q.relevant, 10);
    const firstRank = q.actual.findIndex((id) => q.relevant.includes(id));
    ranks.push(firstRank >= 0 ? firstRank + 1 : 0);
  }

  return {
    ndcg10: ndcgSum / queries.length,
    recall10: recallSum / queries.length,
    precision10: precisionSum / queries.length,
    mrr: mrr(ranks),
    queryCount: queries.length,
  };
}
