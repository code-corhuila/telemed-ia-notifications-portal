import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { NotificationsPage } from './notifications-page';
import type { ShellBridge } from './shell-bridge';

/**
 * Exposed as `./mount`; the shell calls it from MountedRemoteComponent.
 *
 * The portal renders only inside `element` and returns the function the
 * shell calls when the page goes away. Calling it twice is harmless.
 */
export function mount(element: HTMLElement, _bridge: ShellBridge): () => void {
  const root = createRoot(element);
  root.render(
    <StrictMode>
      <NotificationsPage />
    </StrictMode>,
  );

  let mounted = true;
  return () => {
    if (mounted) {
      mounted = false;
      root.unmount();
    }
  };
}
