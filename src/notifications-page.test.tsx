import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { InboxNotification, InboxPage } from './inbox/inbox-types';
import { NotificationsPage } from './notifications-page';
import type { ShellBridge } from './shell-bridge';
import { ShellBridgeProvider } from './shell-bridge-context';

const DOCUMENT_ID = '00000000-0000-4000-8000-000000000001';
const APPOINTMENT_ID = '00000000-0000-4000-8000-000000000002';

const documentReady: InboxNotification = {
  id: DOCUMENT_ID,
  type: 'DOCUMENT_READY',
  subject: { type: 'DOCUMENT', id: '11111111-1111-4111-8111-111111111111', at: null },
  read: false,
  readAt: null,
  createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
};

const confirmed: InboxNotification = {
  id: APPOINTMENT_ID,
  type: 'APPOINTMENT_CONFIRMED',
  subject: { type: 'APPOINTMENT', id: '22222222-2222-4222-8222-222222222222', at: '2026-10-28T15:00:00Z' },
  read: true,
  readAt: new Date().toISOString(),
  createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
};

function inbox(data: InboxNotification[], meta: Partial<InboxPage['meta']> = {}): InboxPage {
  return { data, meta: { page: 1, limit: 20, total: data.length, totalPages: 1, ...meta } };
}

const NETWORK_ERROR = { status: 0, code: 'NETWORK_ERROR', message: 'Cannot reach the server.', traceId: 'trace-9' };

type Listing = (params?: Record<string, string | number>) => Promise<InboxPage>;

function fakeBridge(list: Listing = () => Promise.resolve(inbox([documentReady, confirmed]))) {
  const get = vi.fn((path: string, params?: Record<string, string | number>) =>
    path === '/notifications/unread-count' ? Promise.resolve({ unreadCount: 1 }) : list(params),
  );
  const bridge: ShellBridge = {
    api: { get: get as ShellBridge['api']['get'], post: vi.fn(), put: vi.fn().mockResolvedValue(null), delete: vi.fn() },
    session: () => ({ userId: '0b9d3c1e-7f2a-4c55-9a43-1d2e3f4a5b6c', role: 'PATIENT', name: 'Ana' }),
    navigate: vi.fn().mockResolvedValue(true),
  };
  return bridge;
}

function renderPage(bridge: ShellBridge) {
  render(
    <ShellBridgeProvider bridge={bridge}>
      <NotificationsPage />
    </ShellBridgeProvider>,
  );
}

async function loaded(bridge = fakeBridge()) {
  renderPage(bridge);
  await screen.findByText('El resumen de tu consulta está listo');
  return bridge;
}

describe('NotificationsPage', () => {
  it('shows the notifications grouped by day with the unread summary', async () => {
    await loaded();

    expect(screen.getByRole('heading', { level: 1, name: 'Notificaciones' })).toBeInTheDocument();
    expect(screen.getByText('Tienes 1 notificación sin leer.')).toBeInTheDocument();
    const today = screen.getByRole('region', { name: 'Hoy' });
    expect(within(today).getAllByRole('listitem')).toHaveLength(2);
    expect(within(today).getByText('Tu cita fue confirmada')).toBeInTheDocument();
    expect(within(today).getByText('No leída')).toBeInTheDocument();
  });

  it('shows a busy placeholder until the inbox arrives', async () => {
    renderPage(fakeBridge(() => new Promise(() => undefined)));

    const loading = screen.getByRole('status');
    expect(loading).toHaveTextContent('Cargando notificaciones');
    expect(loading).toHaveAttribute('aria-busy', 'true');
  });

  it('explains a failure with the support reference and retries', async () => {
    const user = userEvent.setup();
    const list = vi.fn<Listing>().mockRejectedValueOnce(NETWORK_ERROR).mockResolvedValue(inbox([documentReady]));
    renderPage(fakeBridge(list));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No pudimos cargar tus notificaciones');
    expect(alert).toHaveTextContent('No pudimos conectarnos.');
    expect(alert).toHaveTextContent('Referencia para soporte: trace-9');

    await user.click(within(alert).getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('El resumen de tu consulta está listo')).toBeInTheDocument();
  });

  it('opens the documents page and marks the notification read', async () => {
    const user = userEvent.setup();
    const bridge = await loaded();

    await user.click(screen.getByRole('button', { name: 'Ver documento' }));

    expect(bridge.api.put).toHaveBeenCalledWith(`/notifications/${DOCUMENT_ID}/read`, null);
    expect(bridge.navigate).toHaveBeenCalledWith('/documents');
  });

  it('opens an appointment already read without marking it again', async () => {
    const user = userEvent.setup();
    const bridge = await loaded();

    await user.click(screen.getByRole('button', { name: 'Ver cita' }));

    expect(bridge.navigate).toHaveBeenCalledWith('/appointment');
    expect(bridge.api.put).not.toHaveBeenCalled();
  });

  it('marks one notification read', async () => {
    const user = userEvent.setup();
    const bridge = await loaded();

    await user.click(screen.getByRole('button', { name: 'Marcar como leída: El resumen de tu consulta está listo' }));

    expect(bridge.api.put).toHaveBeenCalledWith(`/notifications/${DOCUMENT_ID}/read`, null);
    expect(screen.queryByRole('button', { name: /^Marcar como leída/ })).not.toBeInTheDocument();
    expect(screen.getByText('Leíste todas tus notificaciones.')).toBeInTheDocument();
  });

  it('marks every notification read', async () => {
    const user = userEvent.setup();
    const bridge = await loaded();
    const markAll = screen.getByRole('button', { name: 'Marcar todas como leídas' });

    await user.click(markAll);

    expect(bridge.api.put).toHaveBeenCalledWith('/notifications/read-all', null);
    expect(markAll).toBeDisabled();
  });

  it('filters by unread and by type', async () => {
    const user = userEvent.setup();
    const bridge = await loaded();

    await user.click(screen.getByRole('button', { name: /^No leídas/ }));
    await waitFor(() =>
      expect(bridge.api.get).toHaveBeenCalledWith('/notifications', { page: 1, limit: 20, unread: 'true' }),
    );
    expect(screen.getByRole('button', { name: /^No leídas/ })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Documentos' }));
    await waitFor(() =>
      expect(bridge.api.get).toHaveBeenCalledWith('/notifications', {
        page: 1,
        limit: 20,
        unread: 'true',
        type: 'DOCUMENT_READY',
      }),
    );
    expect(screen.getByRole('button', { name: 'Documentos' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('says when there is nothing yet', async () => {
    renderPage(fakeBridge(() => Promise.resolve(inbox([]))));

    expect(await screen.findByRole('heading', { level: 2, name: 'Aún no tienes notificaciones' })).toBeInTheDocument();
    expect(screen.getByText(/Aquí te avisaremos/)).toBeInTheDocument();
  });

  it('offers to clear a filter that leaves nothing', async () => {
    const user = userEvent.setup();
    await loaded(fakeBridge((params) => Promise.resolve(inbox(params ? [] : [documentReady]))));

    await user.click(screen.getByRole('button', { name: 'Documentos' }));
    await screen.findByRole('heading', { level: 2, name: 'No hay notificaciones con este filtro' });
    await user.click(screen.getByRole('button', { name: 'Ver todas' }));

    expect(await screen.findByText('El resumen de tu consulta está listo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('loads more until every notification is shown', async () => {
    const user = userEvent.setup();
    const list = vi
      .fn<Listing>()
      .mockResolvedValueOnce(inbox([documentReady], { total: 2, totalPages: 2 }))
      .mockResolvedValueOnce(inbox([confirmed], { page: 2, total: 2, totalPages: 2 }));
    const bridge = await loaded(fakeBridge(list));
    expect(screen.getByText('Mostrando 1 de 2 notificaciones')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cargar más' }));

    expect(await screen.findByText('Tu cita fue confirmada')).toBeInTheDocument();
    expect(bridge.api.get).toHaveBeenCalledWith('/notifications', { page: 2, limit: 20 });
    expect(screen.getByText('Mostrando 2 de 2 notificaciones')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cargar más' })).not.toBeInTheDocument();
  });

  it('tells when marking read failed and lets the user close it', async () => {
    const user = userEvent.setup();
    const bridge = fakeBridge();
    vi.mocked(bridge.api.put).mockRejectedValue(NETWORK_ERROR);
    await loaded(bridge);

    await user.click(screen.getByRole('button', { name: /^Marcar como leída/ }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No pudimos conectarnos.');
    await user.click(within(alert).getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
