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

const LOCALE = 'es-CO';
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/**
 * The copy comes only from the type and the subject time: names are not
 * stored in notifications and are resolved later from their own APIs.
 */
export function presentNotification(notification: InboxNotification, options: PresentOptions): NotificationView {
  return {
    id: notification.id,
    type: notification.type,
    unread: !notification.read,
    ...copyFor(notification, options),
    time: relativeTime(new Date(notification.createdAt), options),
  };
}

/** Groups in the order given (newest first from the API) by local calendar day. */
export function groupByDay(
  notifications: readonly InboxNotification[],
  options: { readonly now: Date; readonly timeZone?: string },
): DayGroup<InboxNotification>[] {
  const today = dayKey(options.now, options.timeZone);
  const yesterday = shiftDay(today, -1);
  const groups: { key: string; label: string; items: InboxNotification[] }[] = [];

  for (const notification of notifications) {
    const created = new Date(notification.createdAt);
    const key = dayKey(created, options.timeZone);
    let group = groups.find((candidate) => candidate.key === key);
    if (!group) {
      const label =
        key === today
          ? 'Hoy'
          : key === yesterday
            ? 'Ayer'
            : longDay(created, options.timeZone, key.slice(0, 4) !== today.slice(0, 4));
      group = { key, label, items: [] };
      groups.push(group);
    }
    group.items.push(notification);
  }

  return groups.map(({ label, items }) => ({ label, items }));
}

type Copy = Pick<NotificationView, 'title' | 'detail' | 'actionLabel' | 'target'>;

function copyFor(notification: InboxNotification, options: PresentOptions): Copy {
  if (notification.type === 'DOCUMENT_READY') {
    return {
      title: 'El resumen de tu consulta está listo',
      detail: 'Ya puedes verlo y descargarlo en tus documentos.',
      actionLabel: 'Ver documento',
      target: '/documents',
    };
  }

  const professional = options.role === 'PROFESSIONAL';
  const at = notification.subject?.at ? new Date(notification.subject.at) : null;
  const when = at ? `${longDay(at, options.timeZone, false)} · ${clock(at, options.timeZone)}` : null;
  const fallback = professional ? 'Revisa los detalles en tu agenda.' : 'Revisa los detalles en tus citas.';
  const target = professional ? '/appointment/professional' : '/appointment';
  const actionLabel = professional ? 'Ver mi agenda' : 'Ver cita';

  switch (notification.type) {
    case 'APPOINTMENT_CONFIRMED':
      return {
        title: professional ? 'Tienes una nueva cita' : 'Tu cita fue confirmada',
        detail: when ?? fallback,
        actionLabel,
        target,
      };
    case 'APPOINTMENT_RESCHEDULED':
      return {
        title: professional ? 'Una cita fue reprogramada' : 'Tu cita fue reprogramada',
        detail: when ? `Nueva fecha: ${lowerFirst(when)}` : fallback,
        actionLabel,
        target,
      };
    case 'APPOINTMENT_CANCELLED':
      return {
        title: professional ? 'Una cita fue cancelada' : 'Tu cita fue cancelada',
        detail: when ? `Era el ${lowerFirst(when)}` : fallback,
        actionLabel: professional ? actionLabel : 'Ver mis citas',
        target,
      };
    case 'APPOINTMENT_REMINDER':
      return {
        title: reminderTitle(at, options, professional),
        detail: when ?? fallback,
        actionLabel,
        target,
      };
  }
}

function reminderTitle(at: Date | null, options: PresentOptions, professional: boolean): string {
  const today = dayKey(options.now, options.timeZone);
  const day = at ? dayKey(at, options.timeZone) : null;
  if (day === today) {
    return professional ? 'Tienes una cita hoy' : 'Tu cita es hoy';
  }
  if (day === shiftDay(today, 1)) {
    return professional ? 'Tienes una cita mañana' : 'Tu cita es mañana';
  }
  return professional ? 'Recordatorio de cita' : 'Recordatorio de tu cita';
}

function relativeTime(created: Date, options: PresentOptions): string {
  const elapsed = options.now.getTime() - created.getTime();
  if (elapsed < MINUTE) {
    return 'Ahora';
  }
  if (elapsed < HOUR) {
    return `Hace ${Math.floor(elapsed / MINUTE)} min`;
  }
  if (elapsed < 6 * HOUR) {
    return `Hace ${Math.floor(elapsed / HOUR)} h`;
  }
  return clock(created, options.timeZone);
}

function zone(timeZone: string | undefined): { timeZone?: string } {
  return timeZone ? { timeZone } : {};
}

/** "Miércoles 28 de octubre", plus " de 2025" when asked. */
function longDay(date: Date, timeZone: string | undefined, withYear: boolean): string {
  const parts = new Intl.DateTimeFormat(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...zone(timeZone),
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  const text = `${part('weekday')} ${part('day')} de ${part('month')}${withYear ? ` de ${part('year')}` : ''}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "3:30 p. m.", with plain spaces (Intl uses non-breaking ones). */
function clock(date: Date, timeZone: string | undefined): string {
  return new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit', hour12: true, ...zone(timeZone) })
    .format(date)
    .replace(/[  ]/g, ' ');
}

/** The calendar day in the time zone, as YYYY-MM-DD. */
function dayKey(date: Date, timeZone: string | undefined): string {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', ...zone(timeZone) }).format(date);
}

function shiftDay(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
