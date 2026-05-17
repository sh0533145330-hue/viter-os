import 'server-only';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export interface WorkspaceCreds {
  workspaceId?: string;
  workspaceName?: string;
  industry?: string;
  supabase?: { url: string; serviceRoleKey: string };
  openrouter?: { apiKey: string; defaultModel?: string; embeddingModel?: string };
  nango?: { secretKey: string };
  autonomyDefault?: 'L1' | 'L2' | 'L3' | 'L4';
  tomName?: string;
  timName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// NOTE: Workaround — credentials currently live in ~/.vitaos/workspace.json on the server.
// Real impl should use encrypted store + per-tenant session; @vita/key-custody is available
// for envelope encryption when we wire proper multi-tenant auth.
const STORE_PATH = join(homedir(), '.vitaos', 'workspace.json');

let cache: WorkspaceCreds | null = null;

export async function readWorkspace(): Promise<WorkspaceCreds> {
  if (cache) return cache;
  try {
    const buf = await readFile(STORE_PATH, 'utf8');
    cache = JSON.parse(buf) as WorkspaceCreds;
    return cache;
  } catch {
    cache = {};
    return cache;
  }
}

export async function writeWorkspace(patch: Partial<WorkspaceCreds>): Promise<WorkspaceCreds> {
  const current = await readWorkspace();
  const next: WorkspaceCreds = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  if (!next.createdAt) next.createdAt = next.updatedAt ?? new Date().toISOString();
  await mkdir(dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(next, null, 2), 'utf8');
  cache = next;
  return next;
}

export async function isOnboarded(): Promise<boolean> {
  const w = await readWorkspace();
  return Boolean(w.supabase?.url && w.supabase?.serviceRoleKey && w.openrouter?.apiKey && w.workspaceId);
}

export function clearCache(): void { cache = null; }
