import type { ReactNode } from 'react';

import type { InboxNotificationType } from './inbox-types';
import type { NotificationView } from './presentation';

/** One icon per type (stroke icons, 24px grid), so types differ by shape, not only by color. */
const ICONS: Record<InboxNotificationType, ReactNode> = {
  APPOINTMENT_CONFIRMED: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18m-12 6 2 2 4-4" />
    </>
  ),
  APPOINTMENT_RESCHEDULED: <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5M12 7v5l3 2" />,
  APPOINTMENT_CANCELLED: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18m-11 4 4 4m0-4-4 4" />
    </>
  ),
  APPOINTMENT_REMINDER: <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9m4.3 13a1.94 1.94 0 0 0 3.4 0" />,
  DOCUMENT_READY: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 0v6h6M9 13h6m-6 4h4" />,
};

export function Icon({ children, size = 22 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

interface NotificationItemProps {
  readonly view: NotificationView;
  readonly onOpen: () => void;
  readonly onMarkRead: () => void;
}

export function NotificationItem({ view, onOpen, onMarkRead }: NotificationItemProps) {
  const titleId = `tn-title-${view.id}`;
  return (
    <li className={view.unread ? 'tn-item tn-item--unread' : 'tn-item'}>
      <span className={`tn-icon tn-icon--${view.type}`}>
        <Icon>{ICONS[view.type]}</Icon>
      </span>
      <div className="tn-body">
        <div className="tn-row">
          <p className="tn-item-title" id={titleId}>
            {view.title}
          </p>
          <span className="tn-time">{view.time}</span>
        </div>
        <p className="tn-detail">{view.detail}</p>
        <div className="tn-actions">
          <button type="button" className="tn-action" aria-describedby={titleId} onClick={onOpen}>
            {view.actionLabel}
            <Icon size={16}>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </Icon>
          </button>
          {view.unread && (
            <button
              type="button"
              className="tn-read"
              aria-label={`Marcar como leída: ${view.title}`}
              onClick={onMarkRead}
            >
              Marcar como leída
            </button>
          )}
        </div>
      </div>
      {view.unread && (
        <span className="tn-dot">
          <span className="tn-sr">No leída</span>
        </span>
      )}
    </li>
  );
}
