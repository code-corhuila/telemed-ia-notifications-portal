import { describeError } from './error-message';

const TRACE = '7c1e9a2b-4d3f-4a5b-8c6d-9e0f1a2b3c4d';

describe('describeError', () => {
  it.each([
    [
      { status: 0, code: 'TIMEOUT', message: 'The request took too long.' },
      'El servidor tardó demasiado en responder. Inténtalo de nuevo.',
    ],
    [
      { status: 0, code: 'NETWORK_ERROR', message: 'Cannot reach the server.' },
      'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.',
    ],
    [
      { status: 401, code: 'UNAUTHORIZED', message: 'Missing token.' },
      'Tu sesión terminó. Inicia sesión de nuevo para ver tus notificaciones.',
    ],
    [
      { status: 403, code: 'FORBIDDEN', message: 'Not allowed.' },
      'No tienes permiso para ver estas notificaciones.',
    ],
    [
      { status: 404, code: 'NOTIFICATION_NOT_FOUND', message: 'Not found.' },
      'Esta notificación ya no está disponible.',
    ],
    [
      { status: 500, code: 'INTERNAL_ERROR', message: 'Unexpected server error.' },
      'Algo salió mal. Inténtalo de nuevo en unos minutos.',
    ],
  ])('explains %o in Spanish', (error, message) => {
    expect(describeError(error).message).toBe(message);
  });

  it('never shows the server message', () => {
    const description = describeError({
      status: 400,
      code: 'INVALID_INBOX_QUERY',
      message: 'limit must be between 1 and 100.',
    });

    expect(description.message).toBe('Algo salió mal. Inténtalo de nuevo en unos minutos.');
  });

  it('keeps the trace id as the support reference', () => {
    const description = describeError({ status: 500, code: 'INTERNAL_ERROR', message: 'x', traceId: TRACE });

    expect(description.reference).toBe(TRACE);
  });

  it('has no reference when the error carries no trace id', () => {
    expect(describeError({ status: 500, code: 'INTERNAL_ERROR', message: 'x' }).reference).toBeNull();
  });

  it.each([new Error('boom'), 'boom', null, undefined, { status: '500' }])(
    'falls back to the generic message for %o',
    (error) => {
      expect(describeError(error)).toEqual({
        message: 'Algo salió mal. Inténtalo de nuevo en unos minutos.',
        reference: null,
      });
    },
  );
});
