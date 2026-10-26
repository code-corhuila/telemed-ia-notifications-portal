/**
 * The inbox contract of notifications-api (GET /api/v1/notifications and
 * friends). Dates are RFC 3339 UTC strings; ids are UUIDs.
 */

/** Every type the inbox shows (PASSWORD_RECOVERY is e-mail only). */
export const INBOX_NOTIFICATION_TYPES = [
  'APPOINTMENT_CONFIRMED',
  'APPOINTMENT_RESCHEDULED',
  'APPOINTMENT_CANCELLED',
  'APPOINTMENT_REMINDER',
  'DOCUMENT_READY',
] as const;

export type InboxNotificationType = (typeof INBOX_NOTIFICATION_TYPES)[number];

export type SubjectType = 'APPOINTMENT' | 'DOCUMENT';

/** What the notification is about, so the page can open it. */
export interface InboxSubject {
  readonly type: SubjectType;
  readonly id: string;
  readonly at: string | null;
}

export interface InboxNotification {
  readonly id: string;
  readonly type: InboxNotificationType;
  readonly subject: InboxSubject | null;
  readonly read: boolean;
  readonly readAt: string | null;
  readonly createdAt: string;
}

export interface InboxMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface InboxPage {
  readonly data: readonly InboxNotification[];
  readonly meta: InboxMeta;
}

/**
 * What a failed bridge call rejects with: the shell ApiError
 * (telemed-ia-front src/app/core/http/api-error.ts).
 */
export interface ApiError {
  readonly status: number;
  readonly code: string;
  readonly message: string;
  readonly details?: ReadonlyArray<{ field: string; message: string }>;
  readonly traceId?: string;
}
