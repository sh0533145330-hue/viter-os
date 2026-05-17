/**
 * Scraper playbook DSL.
 *
 * Describes a sequence of browser actions a scraper-tier connector
 * runs against an upstream domain. Authored declaratively so the
 * runtime can replay, snapshot, and audit each step.
 */

import type { ZodTypeAny } from 'zod';

export type ScraperStep =
  | { readonly kind: 'navigate'; readonly url: string }
  | {
      readonly kind: 'wait';
      readonly selector: string;
      readonly timeoutMs?: number | undefined;
    }
  | { readonly kind: 'click'; readonly selector: string }
  | {
      readonly kind: 'fill';
      readonly selector: string;
      readonly valueFrom: 'config' | 'context';
      readonly key: string;
    }
  | {
      readonly kind: 'extract';
      readonly selector: string;
      readonly attribute?: string | undefined;
      readonly multiple?: boolean | undefined;
      readonly bind: string;
    }
  | { readonly kind: 'screenshot'; readonly bind: string };

export interface ScraperPlaybook {
  readonly key: string;
  /** Domain pattern, e.g. `*.example.com` or `competitor.app`. */
  readonly target: string;
  readonly steps: readonly ScraperStep[];
  readonly outputSchema: ZodTypeAny;
}

const KEY_REGEX = /^[a-z0-9][a-z0-9_.-]{0,127}$/;

/**
 * Declare a scraper playbook with runtime invariants:
 *
 * - `key` matches `^[a-z0-9][a-z0-9_.-]{0,127}$`.
 * - `target` is non-empty.
 * - `steps` is non-empty and step shapes are validated.
 * - Every `bind` produced by `extract`/`screenshot` steps is unique.
 */
export function definePlaybook(playbook: ScraperPlaybook): ScraperPlaybook {
  if (!KEY_REGEX.test(playbook.key)) {
    throw new Error(`Playbook key '${playbook.key}' is invalid`);
  }
  if (!playbook.target) {
    throw new Error(`Playbook '${playbook.key}' must declare a target`);
  }
  if (playbook.steps.length === 0) {
    throw new Error(`Playbook '${playbook.key}' must declare at least one step`);
  }
  if (!playbook.outputSchema || typeof playbook.outputSchema.safeParse !== 'function') {
    throw new Error(`Playbook '${playbook.key}' must declare an outputSchema (Zod)`);
  }
  const seenBinds = new Set<string>();
  for (const [i, step] of playbook.steps.entries()) {
    validateStep(playbook.key, i, step, seenBinds);
  }
  return playbook;
}

function validateStep(
  playbookKey: string,
  index: number,
  step: ScraperStep,
  seenBinds: Set<string>,
): void {
  switch (step.kind) {
    case 'navigate':
      if (!step.url) {
        throw new Error(`Playbook '${playbookKey}' step ${index} (navigate) missing url`);
      }
      return;
    case 'wait':
    case 'click':
      if (!step.selector) {
        throw new Error(`Playbook '${playbookKey}' step ${index} (${step.kind}) missing selector`);
      }
      return;
    case 'fill':
      if (!step.selector || !step.key) {
        throw new Error(`Playbook '${playbookKey}' step ${index} (fill) missing selector or key`);
      }
      return;
    case 'extract':
    case 'screenshot':
      if (step.kind === 'extract' && !step.selector) {
        throw new Error(`Playbook '${playbookKey}' step ${index} (extract) missing selector`);
      }
      if (!step.bind) {
        throw new Error(`Playbook '${playbookKey}' step ${index} (${step.kind}) missing bind`);
      }
      if (seenBinds.has(step.bind)) {
        throw new Error(
          `Playbook '${playbookKey}' step ${index} reuses bind '${step.bind}'`,
        );
      }
      seenBinds.add(step.bind);
      return;
  }
}
