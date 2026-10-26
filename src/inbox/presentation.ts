import type { InboxNotification, InboxNotificationType } from './inbox-types';

export interface PresentOptions {
  readonly now: Date;
  /** The session role; PROFESSIONAL gets agenda copy. */
  readonly role: string | null;
  /** Defaults to the browser's time zone. */
  readonly timeZone?: string;
}

/** What the inbox shows for one notification. */
export interface NotificationView {
  readonly id: string;
  readonly type: InboxNotificationType;
  readonly unread: boolean;
  readonly title: string;
  readonly detail: string;
  readonly actionLabel: string;
  /** A shell route, opened with bridge.navigate. */
  readonly target: string;
  readonly time: string;
}

export interface DayGroup<T> {
  readonly label: string;
  readonly items: T[];
}

export function presentNotification(_notification: InboxNotification, _options: PresentOptions): NotificationView {
  throw new Error('Not implemented');
}

export function groupByDay(
  _notifications: readonly InboxNotification[],
  _options: { readonly now: Date; readonly timeZone?: string },
): DayGroup<InboxNotification>[] {
  throw new Error('Not implemented');
}
