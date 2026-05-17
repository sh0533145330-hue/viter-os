import { createHmac, timingSafeEqual } from 'node:crypto';

export interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
  livemode: boolean;
  created: number;
}

export class StripeSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StripeSignatureError';
  }
}

export function verifyStripeSignature(payload: string, signatureHeader: string, secret: string, tolerance = 300): StripeEvent {
  const parts = signatureHeader.split(',');
  const timestampPart = parts.find(p => p.startsWith('t='));
  const v1Parts = parts.filter(p => p.startsWith('v1='));
  if (!timestampPart || v1Parts.length === 0) {
    throw new StripeSignatureError('Invalid signature header format');
  }
  const timestamp = parseInt(timestampPart.slice(2), 10);
  if (Number.isNaN(timestamp)) throw new StripeSignatureError('Invalid timestamp');

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > tolerance) {
    throw new StripeSignatureError('Timestamp outside tolerance');
  }

  const signed = `${timestamp}.${payload}`;
  const expected = createHmac('sha256', secret).update(signed).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');

  const matched = v1Parts.some(p => {
    const sigHex = p.slice(3);
    try {
      const sigBuf = Buffer.from(sigHex, 'hex');
      return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
    } catch {
      return false;
    }
  });

  if (!matched) throw new StripeSignatureError('Signature mismatch');

  try {
    return JSON.parse(payload) as StripeEvent;
  } catch {
    throw new StripeSignatureError('Invalid event JSON');
  }
}

export type StripeEventHandler = (event: StripeEvent) => Promise<void> | void;

export class StripeWebhookRouter {
  private handlers = new Map<string, StripeEventHandler[]>();
  private seenIds = new Set<string>();
  private maxSeenIds = 10000;

  on(eventType: string, handler: StripeEventHandler): this {
    const list = this.handlers.get(eventType) ?? [];
    list.push(handler);
    this.handlers.set(eventType, list);
    return this;
  }

  async dispatch(event: StripeEvent): Promise<{ delivered: boolean; reason?: string }> {
    if (this.seenIds.has(event.id)) {
      return { delivered: false, reason: 'duplicate' };
    }
    this.seenIds.add(event.id);
    if (this.seenIds.size > this.maxSeenIds) {
      const first = this.seenIds.values().next().value;
      if (first) this.seenIds.delete(first);
    }
    const handlers = this.handlers.get(event.type) ?? [];
    for (const handler of handlers) await handler(event);
    return { delivered: true };
  }
}
