import type { ErrorDescription } from './error-message';
import type { InboxApi } from './inbox-api';
import type { InboxNotification, InboxNotificationType } from './inbox-types';

export interface InboxFilterState {
  readonly unreadOnly: boolean;
  readonly type: InboxNotificationType | null;
}

export interface InboxState {
  readonly status: 'loading' | 'ready' | 'error';
  readonly notifications: readonly InboxNotification[];
  /** Null until known, or when the count could not be read. */
  readonly unreadCount: number | null;
  readonly filter: InboxFilterState;
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  /** Why the list could not load (status error). */
  readonly error: ErrorDescription | null;
  /** Why a later action (load more, mark read) failed; the list stays. */
  readonly actionError: ErrorDescription | null;
}

export interface Inbox extends InboxState {
  setFilter(filter: InboxFilterState): void;
  loadMore(): void;
  retry(): void;
  markRead(id: string): void;
  markAllRead(): void;
  dismissActionError(): void;
}

export function useInbox(_api: InboxApi, _pageSize = 20): Inbox {
  throw new Error('Not implemented');
}
