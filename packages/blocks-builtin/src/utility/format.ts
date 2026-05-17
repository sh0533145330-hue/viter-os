import { defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  template: z.string(),
  vars: z.record(z.string(), z.unknown()).default({}),
  escape: z.enum(['none', 'html', 'markdown']).default('none'),
});

const outputs = z.object({ text: z.string() });

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

const HTML_REPLACEMENTS: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_REPLACEMENTS[c] ?? c);
}

function escapeMarkdown(value: string): string {
  return value.replace(/[\\`*_{}\[\]()#+\-.!|>]/g, (c) => `\\${c}`);
}

function resolvePath(vars: Record<string, unknown>, path: string): unknown {
  if (path === '.') return vars;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, vars);
}

/** Mustache-style format block with HTML/MD escape modes. */
export const formatBlock = defineBlock<Inputs, Outputs>({
  key: 'utility.format',
  category: 'utility',
  description: 'Substitute {{var}} placeholders with HTML/Markdown escaping.',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input) => {
    const escaper =
      input.escape === 'html'
        ? escapeHtml
        : input.escape === 'markdown'
          ? escapeMarkdown
          : (s: string) => s;
    const text = input.template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, path: string) => {
      const value = resolvePath(input.vars, path);
      if (value === undefined || value === null) return '';
      return escaper(String(value));
    });
    return { text };
  },
});
