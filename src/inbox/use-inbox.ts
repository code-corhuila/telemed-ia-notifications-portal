import { useCallback, useEffect, useRef, useState } from 'react';

import { describeError, type ErrorDescription } from './error-message';
import type { InboxApi, InboxFilter } from './inbox-api';
import type { InboxMeta, InboxNotification, InboxNotificationType } from './inbox-types';

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
  /** How many notifications match the filter, from the API; null until known. */
  readonly total: number | null;
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

type Data = Omit<InboxState, 'filter' | 'total' | 'hasMore'> & { readonly meta: InboxMeta | null };

const INITIAL: Data = { status: 'loading', notifications: [], meta: null, unreadCount: null, loadingMore: false, error: null, actionError: null };

/**
 * The inbox page state. Marking read is optimistic: the page changes at once
 * and only what was changed is put back if the API fails. Every load belongs
 * to a generation; answers from an older filter (or after unmount) are dropped.
 */
export function useInbox(api: InboxApi, pageSize = 20): Inbox {
  const [filter, setFilter] = useState<InboxFilterState>({ unreadOnly: false, type: null });
  const [reloads, setReloads] = useState(0);
  const [data, setData] = useState<Data>(INITIAL);

  const latest = useRef(data);
  latest.current = data;
  const generation = useRef(0);
  const loadingMore = useRef(false);

  const query = useCallback(
    (page: number): InboxFilter => {
      const base = { page, limit: pageSize, unreadOnly: filter.unreadOnly };
      return filter.type ? { ...base, type: filter.type } : base;
    },
    [filter, pageSize],
  );

  useEffect(() => {
    const current = ++generation.current;
    const isCurrent = () => current === generation.current;
    loadingMore.current = false;
    setData((d) => ({ ...d, status: 'loading', error: null, actionError: null, loadingMore: false }));

    api.list(query(1)).then(
      (page) => isCurrent() && setData((d) => ({ ...d, status: 'ready', notifications: page.data, meta: page.meta })),
      (error: unknown) =>
        isCurrent() &&
        setData((d) => ({ ...d, status: 'error', notifications: [], meta: null, error: describeError(error) })),
    );
    api.unreadCount().then(
      (count) => isCurrent() && setData((d) => ({ ...d, unreadCount: count })),
      () => isCurrent() && setData((d) => ({ ...d, unreadCount: null })),
    );

    return () => {
      generation.current++;
    };
  }, [api, query, reloads]);

  const loadMore = useCallback(() => {
    const { status, meta } = latest.current;
    if (status !== 'ready' || !meta || meta.page >= meta.totalPages || loadingMore.current) {
      return;
    }
    const current = generation.current;
    loadingMore.current = true;
    setData((d) => ({ ...d, loadingMore: true, actionError: null }));

    api.list(query(meta.page + 1)).then(
      (page) => {
        if (current !== generation.current) return;
        loadingMore.current = false;
        setData((d) => ({ ...d, loadingMore: false, meta: page.meta, notifications: append(d.notifications, page.data) }));
      },
      (error: unknown) => {
        if (current !== generation.current) return;
        loadingMore.current = false;
        setData((d) => ({ ...d, loadingMore: false, actionError: describeError(error) }));
      },
    );
  }, [api, query]);

  const markRead = useCallback(
    (id: string) => {
      const target = latest.current.notifications.find((n) => n.id === id);
      if (!target || target.read) {
        return;
      }
      const current = generation.current;
      setData((d) => ({ ...d, notifications: setRead(d.notifications, [id]), unreadCount: shift(d.unreadCount, -1) }));

      api.markRead(id).catch((error: unknown) => {
        if (current !== generation.current) return;
        setData((d) => ({
          ...d,
          notifications: setUnread(d.notifications, [id]),
          unreadCount: shift(d.unreadCount, 1),
          actionError: describeError(error),
        }));
      });
    },
    [api],
  );

  const markAllRead = useCallback(() => {
    const { notifications, unreadCount } = latest.current;
    const changed = notifications.filter((n) => !n.read).map((n) => n.id);
    if (changed.length === 0 && unreadCount === 0) {
      return;
    }
    const current = generation.current;
    setData((d) => ({ ...d, notifications: setRead(d.notifications, changed), unreadCount: 0 }));

    api.markAllRead().catch((error: unknown) => {
      if (current !== generation.current) return;
      setData((d) => ({
        ...d,
        notifications: setUnread(d.notifications, changed),
        unreadCount,
        actionError: describeError(error),
      }));
    });
  }, [api]);

  const retry = useCallback(() => setReloads((n) => n + 1), []);
  const dismissActionError = useCallback(() => setData((d) => ({ ...d, actionError: null })), []);

  return {
    status: data.status,
    notifications: data.notifications,
    unreadCount: data.unreadCount,
    filter,
    total: data.meta?.total ?? null,
    hasMore: data.meta !== null && data.meta.page < data.meta.totalPages,
    loadingMore: data.loadingMore,
    error: data.error,
    actionError: data.actionError,
    setFilter,
    loadMore,
    retry,
    markRead,
    markAllRead,
    dismissActionError,
  };
}

/** Adds the next page, skipping any id already shown (the list may have shifted). */
function append(shown: readonly InboxNotification[], next: readonly InboxNotification[]): InboxNotification[] {
  const ids = new Set(shown.map((n) => n.id));
  return [...shown, ...next.filter((n) => !ids.has(n.id))];
}

function setRead(notifications: readonly InboxNotification[], ids: readonly string[]): InboxNotification[] {
  const readAt = new Date().toISOString();
  return notifications.map((n) => (ids.includes(n.id) && !n.read ? { ...n, read: true, readAt } : n));
}

function setUnread(notifications: readonly InboxNotification[], ids: readonly string[]): InboxNotification[] {
  return notifications.map((n) => (ids.includes(n.id) ? { ...n, read: false, readAt: null } : n));
}

function shift(count: number | null, by: number): number | null {
  return count === null ? null : Math.max(0, count + by);
}
