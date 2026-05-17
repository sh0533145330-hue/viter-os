import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface ScaffoldTemplate {
  files: Array<{ path: string; contents: string }>;
}

export function blockTemplate(name: string): ScaffoldTemplate {
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '-');
  return {
    files: [
      {
        path: `${safeName}.ts`,
        contents: `import { defineBlock } from '@vita/core';
import { z } from 'zod';

export const ${camel(safeName)}Block = defineBlock({
  id: '${safeName}',
  version: '0.1.0',
  description: 'TODO: describe block',
  input: z.object({}),
  output: z.object({ ok: z.boolean() }),
  async run(_input, _ctx) {
    return { ok: true };
  },
});
`,
      },
      {
        path: `${safeName}.test.ts`,
        contents: `import { describe, it, expect } from 'vitest';
import { ${camel(safeName)}Block } from './${safeName}.js';

describe('${safeName}', () => {
  it('runs with valid input', async () => {
    const result = await ${camel(safeName)}Block.run({}, {} as never);
    expect(result.ok).toBe(true);
  });
});
`,
      },
    ],
  };
}

export function agentTemplate(name: string): ScaffoldTemplate {
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '-');
  return {
    files: [
      {
        path: `${safeName}.ts`,
        contents: `import { defineAgent } from '@vita/agents';

export const ${camel(safeName)}Agent = defineAgent({
  id: '${safeName}',
  kind: 'specialist',
  defaultAutonomy: 'L2',
  systemPrompt: 'TODO: write prompt for ${safeName}',
  tools: [],
  boundary: { internalReadsOk: true, internalWritesOk: false, externalSendsOk: false },
});
`,
      },
    ],
  };
}

export function connectorTemplate(name: string): ScaffoldTemplate {
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '-');
  return {
    files: [
      {
        path: `${safeName}.ts`,
        contents: `import { NativeApiConnector } from '@vita/connector-sdk';

export class ${pascal(safeName)}Connector extends NativeApiConnector {
  readonly id = '${safeName}';
  readonly displayName = '${pascal(safeName)}';
}
`,
      },
    ],
  };
}

export function packTemplate(name: string): ScaffoldTemplate {
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '-');
  return {
    files: [
      {
        path: 'pack.json',
        contents: JSON.stringify({
          name: safeName,
          version: '0.1.0',
          description: 'TODO',
          objectTypes: [],
          linkTypes: [],
          actionTypes: [],
          vocabulary: {},
        }, null, 2) + '\n',
      },
    ],
  };
}

export async function writeTemplate(template: ScaffoldTemplate, baseDir: string): Promise<string[]> {
  await mkdir(baseDir, { recursive: true });
  const written: string[] = [];
  for (const file of template.files) {
    const fullPath = join(baseDir, file.path);
    await writeFile(fullPath, file.contents, 'utf8');
    written.push(fullPath);
  }
  return written;
}

function camel(name: string): string {
  return name.replace(/[-_.](\w)/g, (_, c) => c.toUpperCase());
}

function pascal(name: string): string {
  const c = camel(name);
  return c.charAt(0).toUpperCase() + c.slice(1);
}
