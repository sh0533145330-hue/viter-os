/**
 * DocumentExtractor — L0→L1 extraction for document artifacts.
 *
 * Handles PDFs, Word docs, text files, and scraped web pages.
 * Pattern-based extraction (regex + heuristics) for v1.
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

/** Detect common proper-noun patterns that might be entity references. */
function detectProperNounRefs(text: string): EntityRef[] {
  const refs: EntityRef[] = [];
  const seen = new Set<string>();
  // Match sequences of capitalized words (potential person/org names)
  const regex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1]!.trim();
    if (!seen.has(name) && name.length > 3) {
      seen.add(name);
      // Don't add common non-entity patterns
      if (/^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December)/.test(name)) {
        continue;
      }
      refs.push({ kind: 'auto', name });
    }
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
  // Credit card
  if (/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(text)) tags.push('credit_card');
  return tags;
}

// ---------------------------------------------------------------------------
// Sensitivity inference
// ---------------------------------------------------------------------------

function inferSensitivity(text: string, piiTags: string[]): Sensitivity {
  if (piiTags.includes('ssn') || piiTags.includes('credit_card')) return 'restricted';
  if (piiTags.length > 0) return 'confidential';
  if (/confidential|internal\s+only|proprietary/i.test(text)) return 'confidential';
  if (/draft|work\s+in\s+progress/i.test(text)) return 'internal';
  return 'public';
}

// ---------------------------------------------------------------------------
// Section detection
// ---------------------------------------------------------------------------

function detectSections(text: string): string[] {
  const sections: string[] = [];
  const regex = /^(#{1,6})\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    sections.push(match[2]!.trim());
  }
  return sections;
}

// ---------------------------------------------------------------------------
// DocumentExtractor
// ---------------------------------------------------------------------------

export class DocumentExtractor implements Extractor {
  readonly kind = 'document';

  async extract(l0: L0Artifact, _ctx: ExtractorContext): Promise<L1Extraction> {
    const raw = l0.body;

    // Detect entity references
    const inlineRefs = detectEntityRefs(raw);
    const properNounRefs = detectProperNounRefs(raw);
    const entityReferences: EntityRef[] = [...inlineRefs, ...properNounRefs];

    // Sections
    const sections = detectSections(raw);

    // PII and sensitivity
    const piiTags = detectPII(raw);
    const sensitivity = inferSensitivity(raw, piiTags);

    // Tags
    const tags: string[] = ['document'];
    if (sections.length > 0) tags.push('has-sections');
    const mimeType = l0.mimeType;
    if (mimeType.includes('pdf')) tags.push('pdf');
    else if (mimeType.includes('word') || mimeType.includes('docx')) tags.push('word');
    else if (mimeType.includes('html')) tags.push('html');
    else if (mimeType.includes('text')) tags.push('text');

    // Word count
    const wordCount = raw.split(/\s+/).filter((w) => w.length > 0).length;

    // Build frontmatter
    const frontmatter: Record<string, unknown> = {
      kind: 'document',
      source_id: l0.id,
      extractor: 'DocumentExtractor',
      mime_type: mimeType,
      word_count: wordCount,
      entity_references: entityReferences.map((r) => ({ kind: r.kind, name: r.name })),
      sections,
      tags,
      sensitivity,
      pii_tags: piiTags,
    };

    // Build YAML frontmatter + Markdown body
    const yamlLines = Object.entries(frontmatter).map(([k, v]) => {
      if (Array.isArray(v)) {
        if (v.length === 0) return `${k}: []`;
        const items = v.map((item) => {
          if (typeof item === 'object' && item !== null) return `  - ${JSON.stringify(item)}`;
          return `  - ${String(item)}`;
        });
        return `${k}:\n${items.join('\n')}`;
      }
      if (typeof v === 'string' && /[:#{}|>]/.test(v)) return `${k}: "${v.replace(/"/g, '\\"')}"`;
      return `${k}: ${String(v)}`;
    });
    const yamlFm = yamlLines.join('\n');

    const title = sections[0] ?? 'Untitled Document';
    const markdownBody = `---\n${yamlFm}\n---\n\n# ${title}\n\n${raw.trim()}`;

    return {
      kind: 'document',
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
