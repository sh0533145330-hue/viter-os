/**
 * ChatMessageExtractor — L0→L1 extraction for chat/IM artifacts.
 *
 * Handles Slack messages, Teams chat, and similar artifacts.
 * Pattern-based extraction for v1.
 */

import type { Extractor } from '../extractor.js';
import type { L0Artifact, L1Extraction, ExtractorContext, EntityRef, Sensitivity } from '../types.js';

// ---------------------------------------------------------------------------
// Message parsing
// ---------------------------------------------------------------------------

interface ParsedMessage {
  sender: string;
  timestamp: string;
  text: string;
}

function parseMessages(raw: string): ParsedMessage[] {
  const messages: ParsedMessage[] = [];
  // Match common chat formats:
  // [2024-01-15 10:30] Alice: Hello
  // 2024-01-15T10:30:00Z <Bob> Hey
  // Alice at 10:30: Hi there
  const lineRegex = /^(?:\[([^\]]+)\]\s*|(\d{4}[-T]\d{2}[^Z]*Z?)\s*<([^>]+)>\s*|(\S+)\s+at\s+(\d{1,2}:\d{2}):\s*)(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(raw)) !== null) {
    const text = match[5] ?? match[6] ?? '';
    let sender = '';
    let timestamp = '';
    if (match[1] !== undefined) {
      // [timestamp] format — need to look at rest of line
      const rest = match[0]!;
      const senderMatch = /\]\s*(\S+?):\s/.exec(rest);
      sender = senderMatch?.[1]?.trim() ?? 'unknown';
      timestamp = match[1];
    } else if (match[2] !== undefined) {
      timestamp = match[2]!;
      sender = match[3]!.trim();
    } else if (match[4] !== undefined) {
      sender = match[4]!.trim();
      timestamp = match[5] ?? '';
    }
    messages.push({ sender, timestamp, text: text.trim() });
  }
  // If no structured messages found, treat entire body as one message
  if (messages.length === 0) {
    messages.push({ sender: 'unknown', timestamp: '', text: raw.trim() });
  }
  return messages;
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
  // @mentions as person refs
  const mentionRegex = /@(\w[\w.-]+)/g;
  while ((match = mentionRegex.exec(text)) !== null) {
    refs.push({ kind: 'person', name: match[1]!.trim() });
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
  return tags;
}

function inferSensitivity(text: string, piiTags: string[]): Sensitivity {
  if (piiTags.length > 0) return 'confidential';
  if (/dm|direct\s+message|private/i.test(text)) return 'confidential';
  return 'internal';
}

// ---------------------------------------------------------------------------
// ChatMessageExtractor
// ---------------------------------------------------------------------------

export class ChatMessageExtractor implements Extractor {
  readonly kind = 'chat';

  async extract(l0: L0Artifact, _ctx: ExtractorContext): Promise<L1Extraction> {
    const raw = l0.body;

    const messages = parseMessages(raw);
    const participants = [...new Set(messages.map((m) => m.sender))];

    const inlineRefs = detectEntityRefs(raw);
    const participantRefs: EntityRef[] = participants.map((p) => ({ kind: 'person', name: p }));
    const entityReferences: EntityRef[] = [...participantRefs, ...inlineRefs];

    // Detect action items
    const actionItems: string[] = [];
    const actionRegex = /\[action:(\w+):([^\]]+)\]/g;
    let match: RegExpExecArray | null;
    while ((match = actionRegex.exec(raw)) !== null) {
      actionItems.push(`${match[1]}: ${match[2]!.trim()}`);
    }

    const piiTags = detectPII(raw);
    const sensitivity = inferSensitivity(raw, piiTags);

    const tags: string[] = ['chat'];
    if (participants.length > 0) tags.push('has-participants');
    if (actionItems.length > 0) tags.push('has-action-items');
    const channel = l0.metadata['channel'] as string | undefined;
    if (channel) tags.push(`channel:${channel}`);

    const frontmatter: Record<string, unknown> = {
      kind: 'chat',
      source_id: l0.id,
      extractor: 'ChatMessageExtractor',
      participants,
      message_count: messages.length,
      entity_references: entityReferences.map((r) => ({ kind: r.kind, name: r.name })),
      action_items: actionItems,
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

    const channelName = channel ?? 'Chat';
    const markdownBody = `---\n${yamlFm}\n---\n\n# ${channelName}\n\n${raw.trim()}`;

    return {
      kind: 'chat',
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
