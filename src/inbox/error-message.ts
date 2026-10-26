import type { ApiError } from './inbox-types';

/** What the page tells the user about a failure. */
export interface ErrorDescription {
  readonly message: string;
  /** The trace id to quote to support, when there is one. */
  readonly reference: string | null;
}

const GENERIC = 'Algo salió mal. Inténtalo de nuevo en unos minutos.';

/**
 * Turns a bridge rejection into Spanish copy. The server message is never
 * shown: it is technical and in English.
 */
export function describeError(error: unknown): ErrorDescription {
  if (!isApiError(error)) {
    return { message: GENERIC, reference: null };
  }
  return { message: messageFor(error), reference: error.traceId ?? null };
}

function messageFor(error: ApiError): string {
  if (error.code === 'TIMEOUT') {
    return 'El servidor tardó demasiado en responder. Inténtalo de nuevo.';
  }
  if (error.status === 0) {
    return 'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.';
  }
  switch (error.status) {
    case 401:
      return 'Tu sesión terminó. Inicia sesión de nuevo para ver tus notificaciones.';
    case 403:
      return 'No tienes permiso para ver estas notificaciones.';
    case 404:
      return 'Esta notificación ya no está disponible.';
    default:
      return GENERIC;
  }
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as ApiError).status === 'number' &&
    typeof (error as ApiError).code === 'string'
  );
}
