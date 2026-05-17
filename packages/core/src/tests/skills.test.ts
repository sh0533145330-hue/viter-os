import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { SkillRegistrationError } from '../errors.js';
import { createSkillRegistry, defineSkill } from '../skills.js';
import type { SkillContext } from '../skills.js';

const noopCtx: SkillContext = {
  workspaceId: 'ws',
  abort: new AbortController().signal,
  logger: { info: () => undefined, warn: () => undefined, error: () => undefined },
};

describe('skill registry', () => {
  it('registers and retrieves skills', () => {
    const reg = createSkillRegistry();
    const s = defineSkill({
      key: 'searchAndAnswer',
      schema: z.object({ q: z.string() }),
      returns: z.object({ answer: z.string() }),
      description: 'demo',
      handler: async (input: { q: string }) => ({ answer: `you asked ${input.q}` }),
    });
    reg.register(s);
    expect(reg.has('searchAndAnswer')).toBe(true);
    expect(reg.list()).toHaveLength(1);
  });

  it('rejects duplicate keys', () => {
    const reg = createSkillRegistry();
    const s = defineSkill({
      key: 'dup',
      schema: z.any(),
      returns: z.any(),
      description: 'x',
      handler: async () => ({}),
    });
    reg.register(s);
    expect(() => reg.register(s)).toThrow(SkillRegistrationError);
  });

  it('listByAgent filters by owner agent key', () => {
    const reg = createSkillRegistry();
    reg.register(
      defineSkill({
        key: 'a',
        schema: z.any(),
        returns: z.any(),
        description: 'x',
        agentKey: 'tom',
        handler: async () => ({}),
      }),
    );
    reg.register(
      defineSkill({
        key: 'b',
        schema: z.any(),
        returns: z.any(),
        description: 'x',
        agentKey: 'tim',
        handler: async () => ({}),
      }),
    );
    expect(reg.listByAgent('tom').map((s) => s.key)).toEqual(['a']);
  });

  it('skill handler executes', async () => {
    const reg = createSkillRegistry();
    const s = defineSkill({
      key: 'echo',
      schema: z.object({ text: z.string() }),
      returns: z.object({ text: z.string() }),
      description: 'echo',
      handler: async (input: { text: string }) => ({ text: input.text }),
    });
    reg.register(s);
    const skill = reg.get('echo');
    expect(skill).toBeDefined();
    const out = await skill?.handler({ text: 'hi' }, noopCtx);
    expect(out).toEqual({ text: 'hi' });
  });
});
