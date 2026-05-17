import { z } from 'zod';
import type { FixtureWriter } from './workspaces.js';

export const testAgentSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  key: z.string(),
  name: z.string(),
  status: z.enum(['draft', 'active', 'retired']),
  model: z.string(),
  evalSuiteId: z.string().nullable(),
});
export type TestAgent = z.infer<typeof testAgentSchema>;

export interface CreateTestAgentOptions {
  readonly workspaceId: string;
  readonly key?: string;
  readonly name?: string;
  readonly status?: TestAgent['status'];
  readonly model?: string;
  readonly evalSuiteId?: string | null;
  readonly seed?: number;
}

let agentCounter = 0;
export function _resetAgentCounter(): void {
  agentCounter = 0;
}

export async function createTestAgent(
  options: CreateTestAgentOptions,
  writer?: FixtureWriter,
): Promise<TestAgent> {
  const idSeed = options.seed !== undefined ? options.seed : ++agentCounter;
  const agent: TestAgent = testAgentSchema.parse({
    id: `agent_${idSeed.toString().padStart(6, '0')}`,
    workspaceId: options.workspaceId,
    key: options.key ?? `test.agent.${idSeed}`,
    name: options.name ?? `Test Agent ${idSeed}`,
    status: options.status ?? 'draft',
    model: options.model ?? 'stub-model-v1',
    evalSuiteId: options.evalSuiteId === undefined ? null : options.evalSuiteId,
  });
  if (writer) await writer.insert('agent_definitions', agent);
  return agent;
}
