import {
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  trace,
  type Span,
  type SpanOptions,
} from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';

export interface OtelOptions {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  endpoint?: string;
}

let sdk: NodeSDK | null = null;

export function initOtel(opts: OtelOptions): NodeSDK | null {
  if (sdk) return sdk;

  const endpoint = opts.endpoint ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? '';

  if (!endpoint) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);
    return null;
  }

  const headers: Record<string, string> = {};
  if (process.env.HONEYCOMB_API_KEY) {
    headers['x-honeycomb-team'] = process.env.HONEYCOMB_API_KEY;
  }

  const exporter = new OTLPTraceExporter({
    url: `${endpoint.replace(/\/$/, '')}/v1/traces`,
    headers,
  });

  sdk = new NodeSDK({
    resource: new Resource({
      'service.name': opts.serviceName,
      'service.version': opts.serviceVersion ?? '0.0.0',
      'service.namespace': 'vitaos',
      'deployment.environment': opts.environment ?? process.env.NODE_ENV ?? 'development',
    }),
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  const shutdown = async (): Promise<void> => {
    try {
      await sdk?.shutdown();
    } catch {
      // shutdown is best-effort on process exit
    }
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);

  return sdk;
}

export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean | undefined>,
  fn: (span: Span) => Promise<T> | T,
  options: SpanOptions = {},
): Promise<T> {
  const tracer = trace.getTracer('@vita/observability');
  const sanitized = sanitizeAttributes(attributes);

  return tracer.startActiveSpan(name, { ...options, attributes: sanitized }, async (span) => {
    try {
      const result = await fn(span);
      span.end();
      return result;
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: 2, message: (err as Error).message });
      span.end();
      throw err;
    }
  });
}

const PII_KEYS = new Set(['email', 'name', 'body', 'phone', 'address']);

function sanitizeAttributes(
  attrs: Record<string, string | number | boolean | undefined>,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined) continue;
    const leaf = key.split('.').pop() ?? key;
    if (PII_KEYS.has(leaf)) continue;
    out[key] = value;
  }
  return out;
}
