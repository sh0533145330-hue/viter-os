import { writeTemplate, blockTemplate, agentTemplate, connectorTemplate, packTemplate } from './scaffold.js';
import type { ParsedArgs } from './args.js';

export interface CommandContext {
  cwd: string;
  stdout: (msg: string) => void;
  stderr: (msg: string) => void;
}

export type Command = (args: ParsedArgs, ctx: CommandContext) => Promise<number>;

export const helpCommand: Command = async (_args, ctx) => {
  ctx.stdout(`vita — VitaOS dev CLI

Usage:
  vita init <name>                  Scaffold a new VitaOS extension repo
  vita new block <name>             Scaffold a new block
  vita new agent <name>             Scaffold a new agent
  vita new connector <name>         Scaffold a new connector
  vita new pack <name>              Scaffold a new ontology pack
  vita pack publish <path>          (stub) Publish a pack to the registry
  vita pack install <name>          (stub) Install a pack
  vita doctor                       Print environment health checks
  vita help                         Show this help

Flags:
  --dir <path>                      Override output directory
  --force                           Overwrite existing files
`);
  return 0;
};

export const newCommand: Command = async (args, ctx) => {
  const kind = args.subcommand;
  const name = args.positional[0];
  if (!kind || !name) {
    ctx.stderr('usage: vita new <block|agent|connector|pack> <name>\n');
    return 2;
  }
  const outDir = typeof args.flags['dir'] === 'string' ? args.flags['dir'] : ctx.cwd;
  let template;
  switch (kind) {
    case 'block': template = blockTemplate(name); break;
    case 'agent': template = agentTemplate(name); break;
    case 'connector': template = connectorTemplate(name); break;
    case 'pack': template = packTemplate(name); break;
    default:
      ctx.stderr(`Unknown subcommand: ${kind}\n`);
      return 2;
  }
  const written = await writeTemplate(template, outDir);
  for (const p of written) ctx.stdout(`created ${p}\n`);
  return 0;
};

export const initCommand: Command = async (args, ctx) => {
  const name = args.subcommand ?? args.positional[0];
  if (!name) {
    ctx.stderr('usage: vita init <name>\n');
    return 2;
  }
  ctx.stdout(`Initialized VitaOS extension workspace: ${name}\n`);
  ctx.stdout('Next: cd into the new directory and run "vita new block hello-world".\n');
  return 0;
};

export const packCommand: Command = async (args, ctx) => {
  const sub = args.subcommand;
  if (sub === 'publish') {
    const path = args.positional[0] ?? '.';
    ctx.stdout(`(stub) Would sign and publish pack at: ${path}\n`);
    return 0;
  }
  if (sub === 'install') {
    const name = args.positional[0];
    if (!name) { ctx.stderr('usage: vita pack install <name>\n'); return 2; }
    ctx.stdout(`(stub) Would install pack: ${name}\n`);
    return 0;
  }
  ctx.stderr('usage: vita pack <publish|install> ...\n');
  return 2;
};

export const doctorCommand: Command = async (_args, ctx) => {
  ctx.stdout('vita doctor\n');
  ctx.stdout(`  node: ${process.version}\n`);
  ctx.stdout(`  platform: ${process.platform}\n`);
  ctx.stdout(`  cwd: ${process.cwd()}\n`);
  ctx.stdout('  status: ok\n');
  return 0;
};

export const commands: Record<string, Command> = {
  help: helpCommand,
  '--help': helpCommand,
  '-h': helpCommand,
  init: initCommand,
  new: newCommand,
  pack: packCommand,
  doctor: doctorCommand,
};
