import type { ShellBridge } from './shell-bridge';

/** Exposed as `./mount`; the shell calls it from MountedRemoteComponent. */
export function mount(_element: HTMLElement, _bridge: ShellBridge): () => void {
  throw new Error('Not implemented');
}
