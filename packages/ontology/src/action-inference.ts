/**
 * ActionInferenceAgent — detect Actions from L1 text.
 *
 * Scans L1 extraction body text for action items, commitments,
 * requests, and decisions. Returns structured ActionInferenceResult
 * objects that can be fed into the entity_actions table.
 */

import type { Logger, ModelProvider, ActionInferenceResult, EntityRef } from './types.js';

// ---------------------------------------------------------------------------
// Pattern-based action detection
// ---------------------------------------------------------------------------

interface ActionPattern {
  regex: RegExp;
  actionKind: string;
}

const ACTION_PATTERNS: ActionPattern[] = [
  { regex: /\[action:commitment:([^\]]+)\]/g, actionKind: 'commitment' },
  { regex: /\[action:request:([^\]]+)\]/g, actionKind: 'request' },
  { regex: /\[action:decision:([^\]]+)\]/g, actionKind: 'decision' },
  { regex: /\[action:approval:([^\]]+)\]/g, actionKind: 'approval' },
  { regex: /(?:TODO|ACTION\s+ITEM)[:\s]+(.+?)(?:\n|$)/gim, actionKind: 'commitment' },
  { regex: /(?:DEADLINE|DUE\s+(?:BY|DATE))[:\s]+(.+?)(?:\n|$)/gim, actionKind: 'commitment' },
  { regex: /(?:PLEASE|KINDLY)\s+(?:REVIEW|SEND|COMPLETE|APPROVE|PROVIDE|UPDATE)\s+(.+?)(?:\n|$)/gim, actionKind: 'request' },
  { regex: /(?:DECIDED|AGREED)\s+(?:THAT|TO|ON)\s+(.+?)(?:\n|$)/gim, actionKind: 'decision' },
];

// ---------------------------------------------------------------------------
// Due date extraction
// ---------------------------------------------------------------------------

function extractDueDate(text: string): string | undefined {
  // Match common date patterns
  const patterns = [
    /by\s+(?:end\s+of\s+)?(\w+day(?:\s+\w+)?)/i,
    /by\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/,
    /by\s+(\w+\s+\d{1,2}(?:,\s*\d{4})?)/i,
    /due\s+(?:by\s+)?(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    /due\s+(?:by\s+)?(\w+\s+\d{1,2}(?:,\s*\d{4})?)/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Entity reference extraction from action text
// ---------------------------------------------------------------------------

function extractSubjectEntity(text: string): EntityRef | undefined {
  const match = /\[entity:(\w+):([^\]]+)\]/.exec(text);
  if (match) {
    return { kind: match[1]!, name: match[2]!.trim() };
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// ActionInferenceAgent
// ---------------------------------------------------------------------------

export interface ActionInferenceDeps {
  modelProvider?: ModelProvider;
  logger: Logger;
}

export class ActionInferenceAgent {
  private readonly modelProvider: ModelProvider | undefined;
  private readonly logger: Logger;

  constructor(deps: ActionInferenceDeps) {
    this.modelProvider = deps.modelProvider;
    this.logger = deps.logger;
  }

  /**
   * Detect actions from L1 body text.
   * Returns an array of inferred actions.
   */
  async infer(l1Body: string): Promise<ActionInferenceResult[]> {
    const results: ActionInferenceResult[] = [];

    // Pattern-based detection
    for (const pattern of ACTION_PATTERNS) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(l1Body)) !== null) {
        const description = match[1]?.trim() ?? match[0]!.trim();
        const dueDate = extractDueDate(description);
        const subjectEntity = extractSubjectEntity(description);

        results.push({
          actionKind: pattern.actionKind,
          description,
          subjectEntity,
          dueDate,
          confidence: 0.8,
        });
      }
    }

    // LLM-enhanced detection (optional)
    if (this.modelProvider && results.length === 0) {
      const llmResults = await this.llmInfer(l1Body);
      results.push(...llmResults);
    }

    this.logger.info(`ActionInferenceAgent: detected ${results.length} action(s) from L1 text`);
    return results;
  }

  // -----------------------------------------------------------------------
  // LLM-enhanced action detection (optional tier)
  // -----------------------------------------------------------------------

  private async llmInfer(l1Body: string): Promise<ActionInferenceResult[]> {
    if (!this.modelProvider) return [];

    try {
      const truncated = l1Body.slice(0, 2000);
      const response = await this.modelProvider.send({
        model: 'action-inference',
        system: `You detect action items in text. Return JSON array of objects with keys: actionKind (commitment/request/decision), description (string), dueDate (string or null). Return empty array if no actions found.`,
        messages: [{ role: 'user', content: truncated }],
        maxTokens: 500,
        temperature: 0,
      });

      const text = response.text?.trim() ?? '[]';
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) return [];

      return (parsed as unknown[])
        .filter((item: unknown): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item) => ({
          actionKind: (item['actionKind'] as string) ?? 'commitment',
          description: (item['description'] as string) ?? '',
          dueDate: (item['dueDate'] as string) ?? undefined,
          confidence: 0.6,
        }))
        .filter((r: ActionInferenceResult) => r.description.length > 0);
    } catch (err) {
      this.logger.warn('ActionInferenceAgent: LLM inference failed', { error: String(err) });
      return [];
    }
  }
}
