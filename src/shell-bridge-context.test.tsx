import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import type { ShellBridge } from './shell-bridge';
import { ShellBridgeProvider, useShellBridge } from './shell-bridge-context';

const bridge: ShellBridge = {
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  session: () => null,
  navigate: vi.fn(),
};

describe('useShellBridge', () => {
  it('returns the bridge the shell mounted the portal with', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ShellBridgeProvider bridge={bridge}>{children}</ShellBridgeProvider>
    );

    const { result } = renderHook(() => useShellBridge(), { wrapper });

    expect(result.current).toBe(bridge);
  });

  it('fails clearly outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useShellBridge())).toThrow(
      'useShellBridge must be used inside ShellBridgeProvider',
    );
  });
});
