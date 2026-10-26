/** What the page tells the user about a failure. */
export interface ErrorDescription {
  readonly message: string;
  /** The trace id to quote to support, when there is one. */
  readonly reference: string | null;
}

export function describeError(_error: unknown): ErrorDescription {
  throw new Error('Not implemented');
}
