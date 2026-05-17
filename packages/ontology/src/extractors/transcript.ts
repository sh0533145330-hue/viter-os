/**
 * TranscriptExtractor — L0→L1 extraction for audio/video transcripts.
 *
 * Handles meeting transcripts, voice recordings, and similar artifacts.
 * Pattern-based extraction for v1.
 */

import type { Extractor } from '../extractor.js';
import type { L0Artifact, L1Extraction, ExtractorContext, EntityRef, Sensitivity } from '../types.js';

// ---------------------------------------------------------------------------
// Speaker detection
// ---------------------------------------------------------------------------

function detectSpeakers(text: string): string[] {
  const speakers = new Set<string>();
  // Match "Speaker Name:" or "Speaker Name:" or "[Speaker Name]" patterns
  const regex = /^(?:\[([^\]]+)\]|([A-Z][A-Za-z\s]+?)):?\s/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const name = (match[1] ?? match[2])?.trim();
    if (name && name.length > 1 && name.length < 50) {
      speakers.add(name);
    }
  }
  return [...speakers];
}

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
// Action item detection in transcripts
// ---------------------------------------------------------------------------

function detectActionItems(text: string): string[] {
  const actions: string[] = [];
  const regex = /\[action:(\w+):([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    actions.push(`${match[1]}: ${match[2]!.trim()}`);
  }
  // Detect "action item" or "follow up" lines
  const followUpRegex = /(?:action\s+item|follow\s*up|next\s+step)[:\s]+(.+)$/gim;
  while ((match = followUpRegex.exec(text)) !== null) {
    actions.push(`commitment: ${match[1]!.trim()}`);
  }
  return actions;
}

// ---------------------------------------------------------------------------
// Decision detection
// ---------------------------------------------------------------------------

function detectDecisions(text: string): string[] {
  const decisions: string[] = [];
  const regex = /(?:decided|agreed|decision)[:\s]+(.+)$/gim;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    decisions.push(match[1]!.trim());
  }
  return decisions;
}

// ---------------------------------------------------------------------------
// PII detection
// ---------------------------------------------------------------------------

function detectPII(text: string): string[] {
  const tags: string[] = [];
  if (/[\w.-]+@[\w.-]+\.\w{2,}/.test(text)) tags.push('email_address');
  if (/(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) tags.push('phone_number');
  return tags;
}

function inferSensitivity(text: string, piiTags: string[]): Sensitivity {
  if (piiTags.length > 0) return 'confidential';
  if (/board\s+meeting|executive|confidential/i.test(text)) return 'confidential';
  if (/internal|private/i.test(text)) return 'internal';
  return 'internal';
}

// ---------------------------------------------------------------------------
// TranscriptExtractor
// ---------------------------------------------------------------------------

export class TranscriptExtractor implements Extractor {
  readonly kind = 'transcript';

  async extract(l0: L0Artifact, _ctx: ExtractorContext): Promise<L1Extraction> {
    const raw = l0.body;

    const speakers = detectSpeakers(raw);
    const inlineRefs = detectEntityRefs(raw);
    const speakerRefs: EntityRef[] = speakers.map((s) => ({ kind: 'person', name: s }));
    const entityReferences: EntityRef[] = [...speakerRefs, ...inlineRefs];

    const actionItems = detectActionItems(raw);
    const decisions = detectDecisions(raw);

    const piiTags = detectPII(raw);
    const sensitivity = inferSensitivity(raw, piiTags);

    const tags: string[] = ['transcript'];
    if (speakers.length > 0) tags.push('has-speakers');
    if (actionItems.length > 0) tags.push('has-action-items');
    if (decisions.length > 0) tags.push('has-decisions');

    // Duration estimate (rough: ~130 words/min)
    const wordCount = raw.split(/\s+/).filter((w) => w.length > 0).length;
    const estimatedDurationMin = Math.round(wordCount / 130);

    const frontmatter: Record<string, unknown> = {
      kind: 'transcript',
      source_id: l0.id,
      extractor: 'TranscriptExtractor',
      speakers,
      word_count: wordCount,
      estimated_duration_min: estimatedDurationMin,
      entity_references: entityReferences.map((r) => ({ kind: r.kind, name: r.name })),
      action_items: actionItems,
      decisions,
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

    const title = (l0.metadata['title'] as string | undefined) ?? 'Transcript';
    const markdownBody = `---\n${yamlFm}\n---\n\n# ${title}\n\n${raw.trim()}`;

    return {
      kind: 'transcript',
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
