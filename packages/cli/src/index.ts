import { parseArgs } from './args.js';
import { commands, helpCommand, type CommandContext } from './commands.js';

export * from './args.js';
export * from './commands.js';
export * from './scaffold.js';

export async function runCli(argv: string[], ctx: CommandContext): Promise<number> {
  const parsed = parseArgs(argv);
  const command = commands[parsed.command] ?? helpCommand;
  return command(parsed, ctx);
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const ctx: CommandContext = {
    cwd: process.cwd(),
    stdout: (m) => process.stdout.write(m),
    stderr: (m) => process.stderr.write(m),
  };
  runCli(process.argv.slice(2), ctx).then((code) => process.exit(code)).catch((err) => {
    process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
