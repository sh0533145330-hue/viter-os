import { createLogger } from '@vita/observability';

const logger = createLogger('worker-extractor');

async function main(): Promise<void> {
  logger.info({ event: 'startup' }, 'worker-extractor starting');

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'graceful shutdown');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'worker-extractor failed to start');
  process.exit(1);
});