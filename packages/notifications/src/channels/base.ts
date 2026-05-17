import type { DeliveryResult, NotificationPayload } from '../types.js';

export interface Channel {
  readonly key: string;
  send(payload: NotificationPayload): Promise<DeliveryResult>;
  isAvailable?(): Promise<boolean>;
}

export type FetchLike = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export function getFetch(custom?: FetchLike): FetchLike {
  if (custom) return custom;
  return (input, init) => fetch(input, init);
}

export function notConfigured(channel: string): DeliveryResult {
  return { channel, delivered: false, error: 'NOT_CONFIGURED' };
}
