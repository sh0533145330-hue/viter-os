/**
 * Typed event bus for the VitaOS engine.
 *
 * Block runtime and workflow runner emit a discriminated union of
 * {@link VitaEvent}s. Subscribers narrow on `type` to receive
 * fully-typed payloads.
 *
 * This is the in-memory pub/sub variant used by Vitest harnesses and
 * the engine worker before durable persistence (the durable variant
 * lives in `@vita/durable-jobs`).
 */

export type RunId = string & { readonly __brand: 'RunId' };
export type BlockId = string & { readonly __brand: 'BlockId' };
export type StepId = string & { readonly __brand: 'StepId' };

export interface RunStartedEvent {
  readonly type: 'run.started';
  readonly runId: RunId;
  readonly workflowKey: string;
  readonly workflowVersion: number;
  readonly workspaceId: string;
  readonly at: string;
}

export interface RunSucceededEvent {
  readonly type: 'run.succeeded';
  readonly runId: RunId;
  readonly output: unknown;
  readonly at: string;
}

export interface RunFailedEvent {
  readonly type: 'run.failed';
  readonly runId: RunId;
  readonly error: { code: string; message: string };
  readonly at: string;
}

export interface RunCancelledEvent {
  readonly type: 'run.cancelled';
  readonly runId: RunId;
  readonly at: string;
}

export interface BlockStartedEvent {
  readonly type: 'block.started';
  readonly runId: RunId;
  readonly blockId: BlockId;
  readonly stepId: StepId;
  readonly blockKey: string;
  readonly at: string;
}

export interface BlockSucceededEvent {
  readonly type: 'block.succeeded';
  readonly runId: RunId;
  readonly blockId: BlockId;
  readonly stepId: StepId;
  readonly blockKey: string;
  readonly output: unknown;
  readonly latencyMs: number;
  readonly at: string;
}

export interface BlockFailedEvent {
  readonly type: 'block.failed';
  readonly runId: RunId;
  readonly blockId: BlockId;
  readonly stepId: StepId;
  readonly blockKey: string;
  readonly error: { code: string; message: string };
  readonly at: string;
}

export interface BlockRetriedEvent {
  readonly type: 'block.retried';
  readonly runId: RunId;
  readonly blockId: BlockId;
  readonly stepId: StepId;
  readonly blockKey: string;
  readonly attempt: number;
  readonly backoffMs: number;
  readonly at: string;
}

/** Discriminated union of every event the engine emits. */
export type VitaEvent =
  | RunStartedEvent
  | RunSucceededEvent
  | RunFailedEvent
  | RunCancelledEvent
  | BlockStartedEvent
  | BlockSucceededEvent
  | BlockFailedEvent
  | BlockRetriedEvent;

export type VitaEventType = VitaEvent['type'];
export type VitaEventOfType<T extends VitaEventType> = Extract<VitaEvent, { type: T }>;

export type EventHandler<T extends VitaEventType> = (event: VitaEventOfType<T>) => void;
export type AnyEventHandler = (event: VitaEvent) => void;

/**
 * Pub/sub interface for the engine. `on` returns an unsubscribe function;
 * `replay` walks every event recorded so far in insertion order.
 */
export interface EventBus {
  on<T extends VitaEventType>(type: T, handler: EventHandler<T>): () => void;
  onAny(handler: AnyEventHandler): () => void;
  emit(event: VitaEvent): void;
  history(): readonly VitaEvent[];
  replay(from?: number): readonly VitaEvent[];
  clear(): void;
}

class InMemoryEventBus implements EventBus {
  private readonly typed = new Map<VitaEventType, Set<AnyEventHandler>>();
  private readonly anyHandlers = new Set<AnyEventHandler>();
  private readonly log: VitaEvent[] = [];

  on<T extends VitaEventType>(type: T, handler: EventHandler<T>): () => void {
    let bucket = this.typed.get(type);
    if (!bucket) {
      bucket = new Set();
      this.typed.set(type, bucket);
    }
    const wrapped: AnyEventHandler = (event) => {
      if (event.type === type) handler(event as VitaEventOfType<T>);
    };
    bucket.add(wrapped);
    return () => bucket?.delete(wrapped);
  }

  onAny(handler: AnyEventHandler): () => void {
    this.anyHandlers.add(handler);
    return () => this.anyHandlers.delete(handler);
  }

  emit(event: VitaEvent): void {
    this.log.push(event);
    const bucket = this.typed.get(event.type);
    if (bucket) {
      for (const handler of bucket) handler(event);
    }
    for (const handler of this.anyHandlers) handler(event);
  }

  history(): readonly VitaEvent[] {
    return this.log;
  }

  replay(from = 0): readonly VitaEvent[] {
    return this.log.slice(from);
  }

  clear(): void {
    this.log.length = 0;
  }
}

/** Build a fresh in-memory event bus. */
export function createEventBus(): EventBus {
  return new InMemoryEventBus();
}
