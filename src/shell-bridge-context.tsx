import { createContext, useContext, type ReactNode } from 'react';

import type { ShellBridge } from './shell-bridge';

const ShellBridgeContext = createContext<ShellBridge | null>(null);

/** Hands the bridge from mount(element, bridge) to every component. */
export function ShellBridgeProvider({ bridge, children }: { bridge: ShellBridge; children: ReactNode }) {
  return <ShellBridgeContext.Provider value={bridge}>{children}</ShellBridgeContext.Provider>;
}

export function useShellBridge(): ShellBridge {
  const bridge = useContext(ShellBridgeContext);
  if (!bridge) {
    throw new Error('useShellBridge must be used inside ShellBridgeProvider');
  }
  return bridge;
}
