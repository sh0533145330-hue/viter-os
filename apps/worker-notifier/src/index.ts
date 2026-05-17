import { createLogger } from '@vita/observability';

const logger = createLogger('worker-notifier');

async function main(): Promise<void> {
  logger.info({ event: 'startup' }, 'worker-notifier starting');

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'graceful shutdown');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'worker-notifier failed to start');
  process.exit(1);
});