import { AsyncLocalStorage } from 'node:async_hooks';

import pino, { type Logger, type LoggerOptions } from 'pino';

export interface LogContext {
  workspaceId?: string;
  userId?: string;
  runId?: string;
  traceId?: string;
}

const REDACT_PATHS = [
  'password',
  '*.password',
  'token',
  '*.token',
  'secret',
  '*.secret',
  'authorization',
  '*.authorization',
  'cookie',
  '*.cookie',
  'apiKey',
  '*.apiKey',
  '*.api_key',
  'ssn',
  '*.ssn',
  'creditCard',
  '*.creditCard',
  '*.credit_card',
  'email',
  '*.email',
  'phone',
  '*.phone',
  'name',
  '*.name',
  '*.payload.email',
  '*.payload.phone',
  '*.payload.name',
  '*.payload.ssn',
  'access_token',
  '*.access_token',
  'refresh_token',
  '*.refresh_token',
  'private_key',
  '*.private_key',
  'client_secret',
  '*.client_secret',
];

const contextStore = new AsyncLocalStorage<LogContext>();

export function withLogContext<T>(ctx: LogContext, fn: () => T): T {
  const parent = contextStore.getStore() ?? {};
  return contextStore.run({ ...parent, ...ctx }, fn);
}

export function getLogContext(): LogContext {
  return contextStore.getStore() ?? {};
}

export interface CreateLoggerOptions extends LoggerOptions {
  name?: string;
}

export function createLogger(name: string, opts: CreateLoggerOptions = {}): Logger {
  const isProd = process.env.NODE_ENV === 'production';
  const level = opts.level ?? process.env.LOG_LEVEL ?? 'info';

  const base: LoggerOptions = {
    name,
    level,
    redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
    mixin() {
      return getLogContext();
    },
    ...opts,
  };

  if (!isProd) {
    return pino({
      ...base,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l', ignore: 'pid,hostname' },
      },
    });
  }

  return pino(base);
}

export type { Logger } from 'pino';
