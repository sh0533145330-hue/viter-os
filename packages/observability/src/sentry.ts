import type { SentryConfig } from './types.js';

export type { SentryConfig } from './types.js';

let backendInitialized = false;
let frontendInitialized = false;

interface InitLogger {
  info: (obj: Record<string, unknown>, msg?: string) => void;
  warn: (obj: Record<string, unknown>, msg?: string) => void;
}

const noopLogger: InitLogger = {
  info: () => {},
  warn: () => {},
};

export function initSentryBackend(config: SentryConfig, logger: InitLogger = noopLogger): boolean {
  if (backendInitialized) return true;
  if (!config.dsn) {
    logger.warn({ env: config.environment }, 'sentry_backend_skip_no_dsn');
    return false;
  }

  logger.info(
    {
      dsn: '[REDACTED]',
      environment: config.environment ?? 'development',
      release: config.release ?? '0.0.0',
      tracesSampleRate: config.tracesSampleRate ?? 0.1,
    },
    'sentry_backend_would_initialize',
  );

  backendInitialized = true;
  return true;
}

export function initSentryFrontend(config: SentryConfig, logger: InitLogger = noopLogger): boolean {
  if (frontendInitialized) return true;
  if (!config.dsn) {
    logger.warn({ env: config.environment }, 'sentry_frontend_skip_no_dsn');
    return false;
  }

  logger.info(
    {
      dsn: '[REDACTED]',
      environment: config.environment ?? 'development',
      release: config.release ?? '0.0.0',
      tracesSampleRate: config.tracesSampleRate ?? 0.1,
    },
    'sentry_frontend_would_initialize',
  );

  frontendInitialized = true;
  return true;
}

export function _resetSentryForTests(): void {
  backendInitialized = false;
  frontendInitialized = false;
}

export function isSentryBackendInitialized(): boolean {
  return backendInitialized;
}

export function isSentryFrontendInitialized(): boolean {
  return frontendInitialized;
}
