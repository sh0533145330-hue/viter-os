export interface ParsedArgs {
  command: string;
  subcommand?: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const [command = 'help', ...rest] = argv;
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  const result: ParsedArgs = { command, positional, flags };

  let i = 0;
  if (rest[0] && !rest[0].startsWith('-')) {
    result.subcommand = rest[0];
    i = 1;
  }

  while (i < rest.length) {
    const arg = rest[i]!;
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = rest[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i += 2;
      } else {
        flags[key] = true;
        i++;
      }
    } else if (arg.startsWith('-')) {
      flags[arg.slice(1)] = true;
      i++;
    } else {
      positional.push(arg);
      i++;
    }
  }

  return result;
}
