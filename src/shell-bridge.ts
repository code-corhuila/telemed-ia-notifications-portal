/**
 * What the shell hands to this portal in mount(element, bridge).
 *
 * The shell does not expose its bridge through federation, so the portal
 * declares the shape it relies on. It mirrors ShellBridge in
 * telemed-ia-front (src/app/core/bridge/shell-bridge.ts).
 *
 * Norma 5.4.1: the portal has no HTTP client or session of its own. Every
 * request goes through the shell (token, X-Correlation-Id, timeout) and fails
 * with the shell ApiError.
 */
export interface ShellBridge {
  readonly api: {
    get<T>(path: string, params?: Record<string, string | number>): Promise<T>;
    post<T>(path: string, body: unknown, idempotencyKey: string): Promise<T>;
    put<T>(path: string, body: unknown): Promise<T>;
    delete<T>(path: string): Promise<T>;
  };

  /** Who is signed in now, or null; read at each call. */
  session(): ShellBridgeSession | null;

  /** Opens a shell route; anything that is not an in-app path is refused. */
  navigate(path: string): Promise<boolean>;
}

export interface ShellBridgeSession {
  /** The identity UUID (the token's sub). */
  readonly userId: string | null;
  readonly role: string | null;
  readonly name: string;
}
