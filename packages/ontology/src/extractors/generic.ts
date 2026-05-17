/**
 * GenericExtractor — fallback L0→L1 extraction for unknown source kinds.
 *
 * Performs minimal extraction: detect entity refs, PII, infer sensitivity.
 * Used when no specific extractor is registered for a sourceKind.
 */

import type { Extractor } from '../extractor.js';
import type { L0Artifact, L1Extraction, ExtractorContext, EntityRef, Sensitivity } from '../types.js';

// ---------------------------------------------------------------------------
// Entity reference detection
// ---------------------------------------------------------------------------

function detectEntityRefs(text: string): EntityRef[] {
  const refs: EntityRef[] = [];
  const regex = /\[entity:(\w+):([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    refs.push({ kind: match[1]!, name: match[2]!.trim() });
  }
  return refs;
}

// ---------------------------------------------------------------------------
// PII detection
// ---------------------------------------------------------------------------

function detectPII(text: string): string[] {
  const tags: string[] = [];
  if (/[\w.-]+@[\w.-]+\.\w{2,}/.test(text)) tags.push('email_address');
  if (/(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) tags.push('phone_number');
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) tags.push('ssn');
  if (/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(text)) tags.push('credit_card');
  return tags;
}

function inferSensitivity(text: string, piiTags: string[]): Sensitivity {
  if (piiTags.includes('ssn') || piiTags.includes('credit_card')) return 'restricted';
  if (piiTags.length > 0) return 'confidential';
  if (/confidential|internal\s+only|proprietary/i.test(text)) return 'confidential';
  return 'internal';
}

// ---------------------------------------------------------------------------
// Keyword-based tagging
// ---------------------------------------------------------------------------

function inferTags(text: string, mimeType: string): string[] {
  const tags: string[] = ['generic'];
  if (mimeType.includes('json')) tags.push('json');
  else if (mimeType.includes('xml')) tags.push('xml');
  else if (mimeType.includes('csv')) tags.push('csv');
  else if (mimeType.includes('text')) tags.push('text');

  if (/password|secret|key|token/i.test(text)) tags.push('contains-secret');
  return tags;
}

// ---------------------------------------------------------------------------
// GenericExtractor
// ---------------------------------------------------------------------------

export class GenericExtractor implements Extractor {
  readonly kind = 'generic';

  async extract(l0: L0Artifact, _ctx: ExtractorContext): Promise<L1Extraction> {
    const raw = l0.body;

    const entityReferences = detectEntityRefs(raw);
    const piiTags = detectPII(raw);
    const sensitivity = inferSensitivity(raw, piiTags);
    const tags = inferTags(raw, l0.mimeType);

    const wordCount = raw.split(/\s+/).filter((w) => w.length > 0).length;

    const frontmatter: Record<string, unknown> = {
      kind: 'generic',
      source_id: l0.id,
      source_kind: l0.sourceKind,
      extractor: 'GenericExtractor',
      mime_type: l0.mimeType,
      word_count: wordCount,
      entity_references: entityReferences.map((r) => ({ kind: r.kind, name: r.name })),
      tags,
      sensitivity,
      pii_tags: piiTags,
    };

    const yamlLines = Object.entries(frontmatter).map(([k, v]) => {
      if (Array.isArray(v)) {
        if (v.length === 0) return `${k}: []`;
        const items = v.map((item) => `  - ${typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)}`);
        return `${k}:\n${items.join('\n')}`;
      }
      if (typeof v === 'string' && /[:#{}|>]/.test(v)) return `${k}: "${v.replace(/"/g, '\\"')}"`;
      return `${k}: ${String(v)}`;
    });
    const yamlFm = yamlLines.join('\n');

    const markdownBody = `---\n${yamlFm}\n---\n\n# Untitled (${l0.sourceKind})\n\n${raw.trim()}`;

    return {
      kind: 'generic',
      schemaVersion: 1,
      frontmatter,
      body: markdownBody,
      entityReferences,
      tags,
      sensitivity,
      piiTags,
    };
  }
}
