import { createLogger } from '@vita/observability';

const logger = createLogger('worker-engine');

async function main(): Promise<void> {
  logger.info({ event: 'startup' }, 'worker-engine starting');

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'graceful shutdown');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'worker-engine failed to start');
  process.exit(1);
});