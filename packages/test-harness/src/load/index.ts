import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Returns the absolute path to the bundled k6 script template. */
export function getK6TemplatePath(): string {
  return path.join(HERE, 'k6-script.js.template');
}

/** Loads the bundled k6 script template contents as a string. */
export async function readK6Template(): Promise<string> {
  return readFile(getK6TemplatePath(), 'utf8');
}
