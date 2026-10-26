import type { ShellBridge } from '../shell-bridge';
import { createInboxApi } from './inbox-api';
import type { InboxPage } from './inbox-types';

const ID = '5f0c2b8e-3d4a-4e6f-9a1b-2c3d4e5f6a7b';

function bridgeWith(api: Partial<ShellBridge['api']>): ShellBridge {
  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      ...api,
    },
    session: () => null,
    navigate: vi.fn(),
  };
}

const page: InboxPage = {
  data: [],
  meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
};

describe('createInboxApi', () => {
  describe('list', () => {
    it('asks for the first page without query parameters by default', async () => {
      const get = vi.fn().mockResolvedValue(page);
      const inbox = createInboxApi(bridgeWith({ get }));

      await expect(inbox.list()).resolves.toEqual(page);
      expect(get).toHaveBeenCalledWith('/notifications', undefined);
    });

    it('sends only the filters that are set', async () => {
      const get = vi.fn().mockResolvedValue(page);
      const inbox = createInboxApi(bridgeWith({ get }));

      await inbox.list({ page: 2, limit: 10, unreadOnly: true, type: 'DOCUMENT_READY' });
      await inbox.list({ unreadOnly: false });

      expect(get).toHaveBeenNthCalledWith(1, '/notifications', {
        page: 2,
        limit: 10,
        unread: 'true',
        type: 'DOCUMENT_READY',
      });
      expect(get).toHaveBeenNthCalledWith(2, '/notifications', undefined);
    });

    it('passes the bridge rejection through', async () => {
      const failure = { status: 0, code: 'TIMEOUT', message: 'slow' };
      const inbox = createInboxApi(bridgeWith({ get: vi.fn().mockRejectedValue(failure) }));

      await expect(inbox.list()).rejects.toBe(failure);
    });
  });

  it('reads the unread count', async () => {
    const get = vi.fn().mockResolvedValue({ unreadCount: 3 });
    const inbox = createInboxApi(bridgeWith({ get }));

    await expect(inbox.unreadCount()).resolves.toBe(3);
    expect(get).toHaveBeenCalledWith('/notifications/unread-count');
  });

  describe('markRead', () => {
    it('marks one notification as read', async () => {
      const put = vi.fn().mockResolvedValue(null);
      const inbox = createInboxApi(bridgeWith({ put }));

      await expect(inbox.markRead(ID)).resolves.toBeUndefined();
      expect(put).toHaveBeenCalledWith(`/notifications/${ID}/read`, null);
    });

    it.each(['', 'not-a-uuid', `${ID}/../read-all`, '../admin', `${ID}?x=1`])(
      'refuses %j without calling the API',
      async (id) => {
        const put = vi.fn();
        const inbox = createInboxApi(bridgeWith({ put }));

        await expect(inbox.markRead(id)).rejects.toThrow('not a notification id');
        expect(put).not.toHaveBeenCalled();
      },
    );
  });

  it('marks every notification as read', async () => {
    const put = vi.fn().mockResolvedValue(null);
    const inbox = createInboxApi(bridgeWith({ put }));

    await expect(inbox.markAllRead()).resolves.toBeUndefined();
    expect(put).toHaveBeenCalledWith('/notifications/read-all', null);
  });
});
