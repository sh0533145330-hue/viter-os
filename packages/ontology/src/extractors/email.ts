/**
 * EmailExtractor — L0→L1 extraction for email artifacts.
 *
 * Pattern-based extraction (regex + heuristics) for v1.
 * Parses email headers, body text, detects entity references
 * and action items, and produces structured L1 Markdown with
 * YAML frontmatter.
 */

import type { Extractor } from '../extractor.js';
import type { L0Artifact, L1Extraction, ExtractorContext, EntityRef, Sensitivity } from '../types.js';

// ---------------------------------------------------------------------------
// Header parsing helpers
// ---------------------------------------------------------------------------

/** Extract a single header value from raw email text. */
function parseHeader(raw: string, name: string): string | undefined {
  const regex = new RegExp(`^${name}:\\s*(.+)$`, 'mi');
  const match = regex.exec(raw);
  return match?.[1]?.trim();
}

/** Extract all addresses from a header (comma-separated). */
function parseAddressList(raw: string, name: string): string[] {
  const value = parseHeader(raw, name);
  if (!value) return [];
  return value
    .split(/[,;]/)
    .map((addr) => addr.trim())
    .filter((addr) => addr.length > 0);
}

// ---------------------------------------------------------------------------
// Entity reference detection
// ---------------------------------------------------------------------------

/** Detect [entity:kind:Name] references in text. */
function detectEntityRefs(text: string): EntityRef[] {
  const refs: EntityRef[] = [];
  const regex = /\[entity:(\w+):([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    refs.push({
      kind: match[1]!,
      name: match[2]!.trim(),
    });
  }
  return refs;
}

/** Detect person names from email headers (From, To, Cc). */
function detectPersonRefsFromHeaders(raw: string): EntityRef[] {
  const refs: EntityRef[] = [];
  const seen = new Set<string>();
  for (const header of ['From', 'To', 'Cc', 'Bcc']) {
    const addrs = parseAddressList(raw, header);
    for (const addr of addrs) {
      // Try to extract display name from "Name <email>" format
      const nameMatch = /^(.+?)\s*</.exec(addr);
      const name = nameMatch?.[1]?.trim() ?? addr;
      if (!seen.has(name)) {
        seen.add(name);
        refs.push({ kind: 'person', name });
      }
    }
  }
  return refs;
}

/** Detect org references from email domains. */
function detectOrgRefsFromHeaders(raw: string): EntityRef[] {
  const refs: EntityRef[] = [];
  const seen = new Set<string>();
  const emailRegex = /[\w.-]+@([\w.-]+\.\w{2,})/g;
  let match: RegExpExecArray | null;
  while ((match = emailRegex.exec(raw)) !== null) {
    const domain = match[1]!;
    const orgName = domain.split('.')[0]!;
    if (!seen.has(orgName)) {
      seen.add(orgName);
      refs.push({ kind: 'org', name: orgName });
    }
  }
  return refs;
}

// ---------------------------------------------------------------------------
// Action item detection
// ---------------------------------------------------------------------------

function detectActionItems(text: string): string[] {
  const actions: string[] = [];
  // Match patterns like [action:commitment:...], action items, TODOs, etc.
  const bracketRegex = /\[action:(\w+):([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = bracketRegex.exec(text)) !== null) {
    actions.push(`${match[1]}: ${match[2]!.trim()}`);
  }
  // Detect plain-text action patterns
  const todoRegex = /^(?:TODO|ACTION|FYI|DEADLINE)[:\s]+(.+)$/gim;
  while ((match = todoRegex.exec(text)) !== null) {
    actions.push(`commitment: ${match[1]!.trim()}`);
  }
  return actions;
}

// ---------------------------------------------------------------------------
// PII detection
// ---------------------------------------------------------------------------

function detectPII(text: string): string[] {
  const tags: string[] = [];
  // Email addresses
  if (/[\w.-]+@[\w.-]+\.\w{2,}/.test(text)) tags.push('email_address');
  // Phone numbers (US-style)
  if (/(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) tags.push('phone_number');
  // SSN
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) tags.push('ssn');
  return tags;
}

// ---------------------------------------------------------------------------
// Sensitivity inference
// ---------------------------------------------------------------------------

function inferSensitivity(raw: string, piiTags: string[]): Sensitivity {
  if (piiTags.includes('ssn')) return 'restricted';
  if (piiTags.includes('phone_number') || piiTags.includes('email_address')) return 'confidential';
  if (/confidential|internal\s+only|do\s+not\s+share/i.test(raw)) return 'confidential';
  return 'internal';
}

// ---------------------------------------------------------------------------
// Body extraction (strip headers)
// ---------------------------------------------------------------------------

function extractBody(raw: string): string {
  // Find first blank line (end of headers)
  const blankLineIdx = raw.indexOf('\n\n');
  if (blankLineIdx === -1) return raw;
  return raw.slice(blankLineIdx + 2).trim();
}

// ---------------------------------------------------------------------------
// EmailExtractor
// ---------------------------------------------------------------------------

export class EmailExtractor implements Extractor {
  readonly kind = 'email';

  async extract(l0: L0Artifact, _ctx: ExtractorContext): Promise<L1Extraction> {
    const raw = l0.body;
    const subject = parseHeader(raw, 'Subject') ?? '(no subject)';
    const from = parseHeader(raw, 'From') ?? '';
    const to = parseAddressList(raw, 'To');
    const cc = parseAddressList(raw, 'Cc');
    const date = parseHeader(raw, 'Date') ?? '';
    const body = extractBody(raw);

    // Detect entity references
    const personRefs = detectPersonRefsFromHeaders(raw);
    const orgRefs = detectOrgRefsFromHeaders(raw);
    const inlineRefs = detectEntityRefs(body);
    const entityReferences: EntityRef[] = [
      ...personRefs,
      ...orgRefs,
      ...inlineRefs,
    ];

    // Detect action items
    const actionItems = detectActionItems(body);

    // PII and sensitivity (scan only the body; headers naturally contain email addresses)
    const piiTags = detectPII(body);
    const sensitivity = inferSensitivity(body, piiTags);

    // Tags
    const tags: string[] = ['email'];
    if (actionItems.length > 0) tags.push('has-action-items');
    if (cc.length > 0) tags.push('has-cc');

    // Build frontmatter
    const frontmatter: Record<string, unknown> = {
      kind: 'email',
      source_id: l0.id,
      extractor: 'EmailExtractor',
      subject,
      from,
      to,
      cc,
      date,
      entity_references: entityReferences.map((r) => ({ kind: r.kind, name: r.name })),
      action_items: actionItems,
      tags,
      sensitivity,
      pii_tags: piiTags,
    };

    // Build YAML frontmatter + Markdown body
    const yamlFm = Object.entries(frontmatter)
      .map(([k, v]) => {
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
      })
      .join('\n');

    const markdownBody = `---\n${yamlFm}\n---\n\n# ${subject}\n\n**From:** ${from}\n**Date:** ${date}\n\n${body}`;

    return {
      kind: 'email',
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
