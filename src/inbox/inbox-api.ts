import type { ShellBridge } from '../shell-bridge';
import type { InboxNotificationType, InboxPage } from './inbox-types';

export interface InboxFilter {
  readonly page?: number;
  readonly limit?: number;
  readonly unreadOnly?: boolean;
  readonly type?: InboxNotificationType;
}

/** The caller's inbox; the recipient is always the signed-in user. */
export interface InboxApi {
  list(filter?: InboxFilter): Promise<InboxPage>;
  unreadCount(): Promise<number>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

const PATH = '/notifications';

// The id goes into the path, so only a plain UUID is accepted.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The inbox client. Every request goes through the shell bridge, which adds
 * the token and X-Correlation-Id and rejects with the shell ApiError.
 */
export function createInboxApi(bridge: ShellBridge): InboxApi {
  return {
    list: (filter = {}) => bridge.api.get<InboxPage>(PATH, queryOf(filter)),

    unreadCount: async () => {
      const { unreadCount } = await bridge.api.get<{ unreadCount: number }>(`${PATH}/unread-count`);
      return unreadCount;
    },

    markRead: async (id) => {
      if (!UUID.test(id)) {
        throw new Error(`${JSON.stringify(id)} is not a notification id`);
      }
      await bridge.api.put(`${PATH}/${id}/read`, null);
    },

    markAllRead: async () => {
      await bridge.api.put(`${PATH}/read-all`, null);
    },
  };
}

function queryOf(filter: InboxFilter): Record<string, string | number> | undefined {
  const query: Record<string, string | number> = {};
  if (filter.page !== undefined) {
    query['page'] = filter.page;
  }
  if (filter.limit !== undefined) {
    query['limit'] = filter.limit;
  }
  if (filter.unreadOnly) {
    query['unread'] = 'true';
  }
  if (filter.type !== undefined) {
    query['type'] = filter.type;
  }
  return Object.keys(query).length > 0 ? query : undefined;
}
