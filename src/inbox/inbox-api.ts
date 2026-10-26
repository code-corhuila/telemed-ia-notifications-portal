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

export function createInboxApi(_bridge: ShellBridge): InboxApi {
  const notImplemented = () => Promise.reject(new Error('Not implemented'));
  return {
    list: notImplemented,
    unreadCount: notImplemented,
    markRead: notImplemented,
    markAllRead: notImplemented,
  };
}
