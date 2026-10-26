import type { ReactNode } from 'react';

import type { ShellBridge } from './shell-bridge';

export function ShellBridgeProvider({ children }: { bridge: ShellBridge; children: ReactNode }) {
  return <>{children}</>;
}

export function useShellBridge(): ShellBridge {
  throw new Error('Not implemented');
}
