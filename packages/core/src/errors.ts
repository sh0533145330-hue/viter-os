/**
 * Error hierarchy for the VitaOS core SDK.
 *
 * Public OSS surface — every error class is exported so block authors and
 * agency operators can reason about failure modes via discriminated `code`
 * fields rather than string parsing.
 */

/** Base class for every VitaOS-thrown error. */
export class VitaError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown> | undefined;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
  }
}

/** Raised when a block input or output fails schema validation. */
export class BlockValidationError extends VitaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('BLOCK_VALIDATION', message, details);
  }
}

/** Raised when a block exceeds its `timeoutMs`. */
export class BlockTimeoutError extends VitaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('BLOCK_TIMEOUT', message, details);
  }
}

/** Raised when an AbortSignal cancels a block mid-flight. */
export class BlockCancelledError extends VitaError {
  constructor(message = 'Block cancelled', details?: Record<string, unknown>) {
    super('BLOCK_CANCELLED', message, details);
  }
}

/** Retryable errors are eligible for the runtime's retry policy. */
export class BlockRetryableError extends VitaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('BLOCK_RETRYABLE', message, details);
  }
}

/** Non-retryable errors halt the block immediately. */
export class BlockNonRetryableError extends VitaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('BLOCK_NON_RETRYABLE', message, details);
  }
}

/** Raised when a per-workspace budget would be exceeded. */
export class BudgetExceededError extends VitaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('BUDGET_EXCEEDED', message, details);
  }
}

/** Raised when a policy gate denies execution. */
export class PolicyDeniedError extends VitaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('POLICY_DENIED', message, details);
  }
}

/** Raised when a workflow fails to topologically sort (cycle, missing block, …). */
export class WorkflowGraphError extends VitaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('WORKFLOW_GRAPH', message, details);
  }
}

/** Raised when two wires connect ports whose schemas don't structurally agree. */
export class WireTypeError extends VitaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('WIRE_TYPE', message, details);
  }
}

/** Raised by stub blocks that declare an interface but defer implementation. */
export class NotImplementedError extends VitaError {
  constructor(what: string, details?: Record<string, unknown>) {
    super('NOT_IMPLEMENTED', `${what} is not implemented in this runtime`, details);
  }
}

/** Raised when a skill key collision is attempted in the registry. */
export class SkillRegistrationError extends VitaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('SKILL_REGISTRATION', message, details);
  }
}
