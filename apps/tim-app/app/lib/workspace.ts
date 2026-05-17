import 'server-only';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface WorkspaceCreds {
  supabase?: { url: string; serviceRoleKey: string };
  openrouter?: { apiKey: string; defaultModel: string; embeddingModel: string };
  nango?: { secretKey: string };
  workspaceId?: string;
  tomName?: string;
  timName?: string;
  autonomyDefault?: 'L1' | 'L2' | 'L3' | 'L4';
}

const STORE_PATH = join(homedir(), '.vitaos', 'workspace.json');
let cache: WorkspaceCreds | null = null;

export async function readWorkspace(): Promise<WorkspaceCreds> {
  if (cache) return cache;
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    cache = JSON.parse(raw) as WorkspaceCreds;
    return cache;
  } catch {
    return {};
  }
}

export const getTimName = (w: WorkspaceCreds) => w.timName ?? 'Tim';
export const getTomName = (w: WorkspaceCreds) => w.tomName ?? 'Tom';
