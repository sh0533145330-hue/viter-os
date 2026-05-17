import type { PiiMatch, PiiType, RedactionResult, RedactorConfig, TaggedRedactionResult } from './types.js';
import { redactorConfigSchema } from './types.js';
import { getDefaultTag, getPatterns } from './patterns.js';

/**
 * PiiRedactor detects and redacts personally identifiable information (PII)
 * from text using regex patterns at configurable strictness levels.
 */
export class PiiRedactor {
  private readonly strictness: RedactorConfig['strictness'];
  private readonly locales: string[];
  private readonly excludeTypes: Set<PiiType>;
  private readonly replacements: Partial<Record<PiiType, string>>;
  private readonly extraPatterns: RedactorConfig['extraPatterns'];

  constructor(config: Partial<RedactorConfig> = {}) {
    const parsed = redactorConfigSchema.parse(config);
    this.strictness = parsed.strictness;
    this.locales = parsed.locales;
    this.excludeTypes = new Set(parsed.excludeTypes);
    this.replacements = (parsed.replacements ?? {}) as Partial<Record<PiiType, string>>;
    this.extraPatterns = parsed.extraPatterns;
  }

  /**
   * Detect PII occurrences in text without replacing them.
   * Returns an array of matches with position info.
   */
  detect(text: string): PiiMatch[] {
    const patterns = getPatterns(this.strictness, this.locales);
    const matches: PiiMatch[] = [];

    for (const piiPattern of patterns) {
      if (this.excludeTypes.has(piiPattern.type)) continue;
      piiPattern.pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = piiPattern.pattern.exec(text)) !== null) {
        matches.push({
          type: piiPattern.type,
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          replacement: this.getReplacement(piiPattern.type),
        });
      }
    }

    // Add extra patterns
    for (const extra of this.extraPatterns) {
      if (this.excludeTypes.has(extra.type)) continue;
      const re = new RegExp(extra.pattern, 'g');
      let match: RegExpExecArray | null;
      while ((match = re.exec(text)) !== null) {
        matches.push({
          type: extra.type,
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          replacement: extra.replacement ?? this.getReplacement(extra.type),
        });
      }
    }

    // Sort by start position, deduplicate overlapping matches (keep longer first)
    matches.sort((a, b) => a.start - b.start || b.end - a.end);

    return this.deduplicate(matches);
  }

  /**
   * Redact PII from text, returning cleaned text and match metadata.
   */
  redact(text: string): RedactionResult {
    const matches = this.detect(text);
    const cleaned = this.applyReplacements(text, matches);
    return { cleaned, matches };
  }

  /**
   * Redact with PII type tags instead of generic replacements.
   * Example: john@example.com → [PII:email]
   */
  redactWithTags(text: string): TaggedRedactionResult {
    const matches = this.detect(text);
    const piiTags: string[] = [];

    // Build tagged result
    const parts: string[] = [];
    let lastEnd = 0;
    for (const m of matches) {
      parts.push(text.slice(lastEnd, m.start));
      const tag = getDefaultTag(m.type);
      parts.push(tag);
      piiTags.push(tag);
      lastEnd = m.end;
    }
    parts.push(text.slice(lastEnd));

    return { cleaned: parts.join(''), piiTags };
  }

  private getReplacement(type: PiiType): string {
    return this.replacements[type] ?? `[REDACTED:${type}]`;
  }

  private applyReplacements(text: string, matches: PiiMatch[]): string {
    if (matches.length === 0) return text;
    const parts: string[] = [];
    let lastEnd = 0;
    for (const m of matches) {
      parts.push(text.slice(lastEnd, m.start));
      parts.push(m.replacement);
      lastEnd = m.end;
    }
    parts.push(text.slice(lastEnd));
    return parts.join('');
  }

  /**
   * Deduplicate overlapping matches, keeping the longest match.
   */
  private deduplicate(matches: PiiMatch[]): PiiMatch[] {
    if (matches.length <= 1) return matches;

    const result: PiiMatch[] = [];
    let current = matches[0]!;

    for (let i = 1; i < matches.length; i++) {
      const next = matches[i]!;
      if (next.start >= current.end) {
        // No overlap
        result.push(current);
        current = next;
      } else if (next.end > current.end) {
        // Overlapping — keep the one that extends further
        current = next;
      }
      // else: next is completely within current, skip it
    }
    result.push(current);
    return result;
  }
}
