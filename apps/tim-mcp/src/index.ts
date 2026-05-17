import { createLogger } from '@vita/observability';
import { McpRateLimiter, McpServer, createTimTools, createMockTimBackend } from './server.js';

const logger = createLogger('tim-mcp');

export * from './protocol.js';
export * from './server.js';

async function main(): Promise<void> {
  logger.info({ event: 'startup' }, 'tim-mcp starting');

  const backend = createMockTimBackend();
  const rateLimiter = new McpRateLimiter({ rpm: 60, dailyCostCapCents: 5000 });
  const tools = createTimTools(backend);

  const server = new McpServer({
    tools,
    rateLimiter,
    resolveContext: async () => {
      const userId = process.env['MCP_USER_ID'] ?? 'mock-user';
      const workspaceId = process.env['MCP_WORKSPACE_ID'] ?? 'mock-workspace';
      return { userId, workspaceId };
    },
    logger,
  });

  process.stdin.setEncoding('utf-8');
  let buffer = '';
  process.stdin.on('data', async (chunk) => {
    buffer += chunk.toString();
    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);
      if (!line) continue;
      try {
        const response = await server.handle(line);
        process.stdout.write(response + '\n');
      } catch (err) {
        logger.error({ err }, 'fatal handler error');
      }
    }
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'graceful shutdown');
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (process.env['MCP_AUTOSTART'] !== 'false' && import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  main().catch((err) => {
    logger.fatal({ err }, 'tim-mcp failed to start');
    process.exit(1);
  });
}
