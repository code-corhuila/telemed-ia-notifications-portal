import { useMemo } from 'react';

import { createInboxApi } from './inbox/inbox-api';
import { INBOX_STYLES } from './inbox/inbox-styles';
import type { InboxNotificationType } from './inbox/inbox-types';
import { Icon, NotificationItem } from './inbox/notification-item';
import { groupByDay, presentNotification, type NotificationView } from './inbox/presentation';
import { useInbox, type Inbox } from './inbox/use-inbox';
import { useShellBridge } from './shell-bridge-context';

/** One chip per API type filter: the API takes a single type per request. */
const TYPE_FILTERS: readonly { type: InboxNotificationType | null; label: string }[] = [
  { type: null, label: 'Todos' },
  { type: 'APPOINTMENT_CONFIRMED', label: 'Confirmadas' },
  { type: 'APPOINTMENT_RESCHEDULED', label: 'Reprogramadas' },
  { type: 'APPOINTMENT_CANCELLED', label: 'Canceladas' },
  { type: 'APPOINTMENT_REMINDER', label: 'Recordatorios' },
  { type: 'DOCUMENT_READY', label: 'Documentos' },
];

/**
 * The inbox page (HU-17). A section, not a main: the shell layout already owns
 * the main landmark. Its styles travel with it because the shell does not load
 * a remote's global CSS.
 */
export function NotificationsPage() {
  const bridge = useShellBridge();
  const api = useMemo(() => createInboxApi(bridge), [bridge]);
  const inbox = useInbox(api);

  const open = (view: NotificationView) => {
    inbox.markRead(view.id);
    void bridge.navigate(view.target);
  };

  return (
    <section className="tn-inbox" aria-labelledby="tn-inbox-title">
      <style>{INBOX_STYLES}</style>

      <header className="tn-header">
        <div>
          <h1 className="tn-title" id="tn-inbox-title">
            Notificaciones
          </h1>
          <p className="tn-summary">{summary(inbox.unreadCount)}</p>
        </div>
        <button
          type="button"
          className="tn-mark-all"
          disabled={inbox.status !== 'ready' || inbox.unreadCount === 0}
          onClick={inbox.markAllRead}
        >
          <Icon size={18}>
            <path d="M18 6 7 17l-5-5m20-2-7.5 7.5L13 16" />
          </Icon>
          Marcar todas como leídas
        </button>
      </header>

      <div className="tn-filters">
        <div className="tn-segmented" role="group" aria-label="Mostrar">
          <button
            type="button"
            className="tn-segment"
            aria-pressed={!inbox.filter.unreadOnly}
            onClick={() => inbox.setFilter({ ...inbox.filter, unreadOnly: false })}
          >
            Todas
          </button>
          <button
            type="button"
            className="tn-segment"
            aria-pressed={inbox.filter.unreadOnly}
            onClick={() => inbox.setFilter({ ...inbox.filter, unreadOnly: true })}
          >
            No leídas
            {inbox.unreadCount ? <span className="tn-badge">{inbox.unreadCount}</span> : null}
          </button>
        </div>
        <div className="tn-chips" role="group" aria-label="Tipo de notificación">
          {TYPE_FILTERS.map(({ type, label }) => (
            <button
              key={label}
              type="button"
              className="tn-chip"
              aria-pressed={inbox.filter.type === type}
              onClick={() => inbox.setFilter({ ...inbox.filter, type })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {inbox.actionError && (
        <p className="tn-message" role="alert">
          {inbox.actionError.message}
        </p>
      )}
      <InboxContent inbox={inbox} onOpen={open} />
    </section>
  );
}

function InboxContent({ inbox, onOpen }: { inbox: Inbox; onOpen: (view: NotificationView) => void }) {
  const bridge = useShellBridge();

  if (inbox.status === 'loading') {
    return (
      <p className="tn-message" role="status">
        Cargando notificaciones…
      </p>
    );
  }
  if (inbox.status === 'error') {
    return (
      <p className="tn-message" role="alert">
        {inbox.error?.message}
      </p>
    );
  }
  if (inbox.notifications.length === 0) {
    const filtered = inbox.filter.unreadOnly || inbox.filter.type !== null;
    return <p className="tn-message">{filtered ? 'No hay notificaciones con este filtro.' : 'Aún no tienes notificaciones.'}</p>;
  }

  const now = new Date();
  const role = bridge.session()?.role ?? null;
  return (
    <>
      {groupByDay(inbox.notifications, { now }).map((group, index) => (
        <section className="tn-group" key={group.label} aria-labelledby={`tn-day-${index}`}>
          <h2 className="tn-day" id={`tn-day-${index}`}>
            {group.label}
          </h2>
          <ul className="tn-list">
            {group.items.map((notification) => {
              const view = presentNotification(notification, { now, role });
              return (
                <NotificationItem
                  key={view.id}
                  view={view}
                  onOpen={() => onOpen(view)}
                  onMarkRead={() => inbox.markRead(view.id)}
                />
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}

function summary(unreadCount: number | null): string {
  if (unreadCount === null) {
    return 'Tus avisos de citas y documentos.';
  }
  if (unreadCount === 0) {
    return 'Leíste todas tus notificaciones.';
  }
  return unreadCount === 1 ? 'Tienes 1 notificación sin leer.' : `Tienes ${unreadCount} notificaciones sin leer.`;
}
