import { act, renderHook, waitFor } from '@testing-library/react';

import type { InboxApi } from './inbox-api';
import type { InboxNotification, InboxPage } from './inbox-types';
import { useInbox } from './use-inbox';

const TIMEOUT = { status: 0, code: 'TIMEOUT', message: 'slow', traceId: 'trace-1' };

function item(n: number, read = false): InboxNotification {
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    type: 'DOCUMENT_READY',
    subject: null,
    read,
    readAt: read ? '2026-10-26T14:00:00Z' : null,
    createdAt: '2026-10-26T14:55:00Z',
  };
}

function page(items: InboxNotification[], pageNumber = 1, totalPages = 1): InboxPage {
  return { data: items, meta: { page: pageNumber, limit: 20, total: items.length, totalPages } };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function fakeApi(overrides: Partial<InboxApi> = {}): InboxApi {
  return {
    list: vi.fn().mockResolvedValue(page([item(1), item(2, true)])),
    unreadCount: vi.fn().mockResolvedValue(1),
    markRead: vi.fn().mockResolvedValue(undefined),
    markAllRead: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

async function ready(api: InboxApi) {
  const hook = renderHook(() => useInbox(api));
  await waitFor(() => expect(hook.result.current.status).toBe('ready'));
  return hook;
}

describe('useInbox', () => {
  it('loads the first page and the unread count', async () => {
    const api = fakeApi();
    const { result } = renderHook(() => useInbox(api));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(api.list).toHaveBeenCalledWith({ page: 1, limit: 20, unreadOnly: false });
    expect(result.current.notifications.map((n) => n.id)).toEqual([item(1).id, item(2).id]);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.hasMore).toBe(false);
  });

  it('shows the error and loads again on retry', async () => {
    const list = vi.fn().mockRejectedValueOnce(TIMEOUT).mockResolvedValue(page([item(1)]));
    const api = fakeApi({ list });
    const { result } = renderHook(() => useInbox(api));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toEqual({
      message: 'El servidor tardó demasiado en responder. Inténtalo de nuevo.',
      reference: 'trace-1',
    });

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.error).toBeNull();
  });

  it('keeps the list when only the unread count fails', async () => {
    const { result } = await ready(fakeApi({ unreadCount: vi.fn().mockRejectedValue(TIMEOUT) }));

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBeNull();
  });

  it('reloads from the first page when the filter changes', async () => {
    const api = fakeApi();
    const { result } = await ready(api);

    act(() => result.current.setFilter({ unreadOnly: true, type: 'APPOINTMENT_REMINDER' }));

    expect(result.current.status).toBe('loading');
    expect(result.current.filter).toEqual({ unreadOnly: true, type: 'APPOINTMENT_REMINDER' });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(api.list).toHaveBeenLastCalledWith({ page: 1, limit: 20, unreadOnly: true, type: 'APPOINTMENT_REMINDER' });
  });

  it('ignores an answer that arrives after a newer filter', async () => {
    const slow = deferred<InboxPage>();
    const list = vi.fn().mockReturnValueOnce(slow.promise).mockResolvedValue(page([item(7)]));
    const api = fakeApi({ list });
    const { result } = renderHook(() => useInbox(api));

    act(() => result.current.setFilter({ unreadOnly: true, type: null }));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(async () => slow.resolve(page([item(1)])));

    expect(result.current.notifications.map((n) => n.id)).toEqual([item(7).id]);
  });

  describe('loadMore', () => {
    it('appends the next page until the last one', async () => {
      const list = vi
        .fn()
        .mockResolvedValueOnce(page([item(1)], 1, 2))
        .mockResolvedValueOnce(page([item(2)], 2, 2));
      const api = fakeApi({ list });
      const { result } = await ready(api);
      expect(result.current.hasMore).toBe(true);

      act(() => result.current.loadMore());
      expect(result.current.loadingMore).toBe(true);

      await waitFor(() => expect(result.current.loadingMore).toBe(false));
      expect(list).toHaveBeenLastCalledWith({ page: 2, limit: 20, unreadOnly: false });
      expect(result.current.notifications.map((n) => n.id)).toEqual([item(1).id, item(2).id]);
      expect(result.current.hasMore).toBe(false);

      act(() => result.current.loadMore());
      expect(list).toHaveBeenCalledTimes(2);
    });

    it('keeps what is shown when the next page fails', async () => {
      const list = vi.fn().mockResolvedValueOnce(page([item(1)], 1, 2)).mockRejectedValueOnce(TIMEOUT);
      const { result } = await ready(fakeApi({ list }));

      act(() => result.current.loadMore());

      await waitFor(() => expect(result.current.actionError).not.toBeNull());
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.hasMore).toBe(true);
    });
  });

  describe('markRead', () => {
    it('marks it read at once and tells the API', async () => {
      const pending = deferred<void>();
      const api = fakeApi({ markRead: vi.fn().mockReturnValue(pending.promise) });
      const { result } = await ready(api);

      act(() => result.current.markRead(item(1).id));

      expect(result.current.notifications[0]?.read).toBe(true);
      expect(result.current.unreadCount).toBe(0);
      expect(api.markRead).toHaveBeenCalledWith(item(1).id);
      await act(async () => pending.resolve());
      expect(result.current.notifications[0]?.read).toBe(true);
    });

    it('puts it back when the API fails', async () => {
      const { result } = await ready(fakeApi({ markRead: vi.fn().mockRejectedValue(TIMEOUT) }));

      act(() => result.current.markRead(item(1).id));

      await waitFor(() => expect(result.current.actionError).not.toBeNull());
      expect(result.current.notifications[0]?.read).toBe(false);
      expect(result.current.unreadCount).toBe(1);

      act(() => result.current.dismissActionError());
      expect(result.current.actionError).toBeNull();
    });

    it('does nothing for one already read', async () => {
      const api = fakeApi();
      const { result } = await ready(api);

      act(() => result.current.markRead(item(2).id));

      expect(api.markRead).not.toHaveBeenCalled();
    });
  });

  describe('markAllRead', () => {
    it('marks every one read at once', async () => {
      const api = fakeApi();
      const { result } = await ready(api);

      act(() => result.current.markAllRead());

      expect(result.current.notifications.every((n) => n.read)).toBe(true);
      expect(result.current.unreadCount).toBe(0);
      expect(api.markAllRead).toHaveBeenCalledOnce();
    });

    it('puts back only the ones it changed when the API fails', async () => {
      const { result } = await ready(fakeApi({ markAllRead: vi.fn().mockRejectedValue(TIMEOUT) }));

      act(() => result.current.markAllRead());

      await waitFor(() => expect(result.current.actionError).not.toBeNull());
      expect(result.current.notifications.map((n) => n.read)).toEqual([false, true]);
      expect(result.current.notifications[1]?.readAt).toBe('2026-10-26T14:00:00Z');
      expect(result.current.unreadCount).toBe(1);
    });
  });
});
