import { z } from 'zod';
import type { FixtureWriter } from './workspaces.js';

export const testPackSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  key: z.string(),
  version: z.string(),
  status: z.enum(['draft', 'published', 'deprecated']),
  manifest: z.record(z.unknown()),
});
export type TestPack = z.infer<typeof testPackSchema>;

export interface CreateTestPackOptions {
  readonly workspaceId: string;
  readonly key?: string;
  readonly version?: string;
  readonly status?: TestPack['status'];
  readonly manifest?: Record<string, unknown>;
  readonly seed?: number;
}

let packCounter = 0;
export function _resetPackCounter(): void {
  packCounter = 0;
}

export async function createTestPack(
  options: CreateTestPackOptions,
  writer?: FixtureWriter,
): Promise<TestPack> {
  const idSeed = options.seed !== undefined ? options.seed : ++packCounter;
  const pack: TestPack = testPackSchema.parse({
    id: `pack_${idSeed.toString().padStart(6, '0')}`,
    workspaceId: options.workspaceId,
    key: options.key ?? `test.pack.${idSeed}`,
    version: options.version ?? '0.0.1',
    status: options.status ?? 'draft',
    manifest: options.manifest ?? { name: 'Test Pack', blocks: [] },
  });
  if (writer) await writer.insert('packs', pack);
  return pack;
}
