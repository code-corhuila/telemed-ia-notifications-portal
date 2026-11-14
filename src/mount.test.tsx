import { act, screen } from '@testing-library/react';

import { mount } from './mount';
import type { ShellBridge } from './shell-bridge';

function fakeBridge(): ShellBridge {
  return {
    api: {
      get: vi.fn().mockReturnValue(new Promise(() => undefined)),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
    session: () => ({ userId: '0b9d3c1e-7f2a-4c55-9a43-1d2e3f4a5b6c', role: 'PATIENT', name: 'Ana' }),
    navigate: vi.fn(),
  };
}

describe('mount', () => {
  let host: HTMLElement;
  let sibling: HTMLElement;

  beforeEach(() => {
    sibling = document.createElement('p');
    sibling.textContent = 'shell content';
    host = document.createElement('div');
    document.body.append(sibling, host);
  });

  afterEach(() => {
    host.remove();
    sibling.remove();
  });

  it('renders the notifications page inside the given element', () => {
    act(() => {
      mount(host, fakeBridge());
    });

    const heading = screen.getByRole('heading', { level: 1, name: 'Notificaciones' });
    expect(host).toContainElement(heading);
  });

  it('returns an unmount function that empties the element', () => {
    let unmount: () => void = () => undefined;
    act(() => {
      unmount = mount(host, fakeBridge());
    });

    act(() => {
      unmount();
    });

    expect(host).toBeEmptyDOMElement();
  });

  it('leaves the rest of the shell untouched', () => {
    let unmount: () => void = () => undefined;
    act(() => {
      unmount = mount(host, fakeBridge());
    });
    act(() => {
      unmount();
    });

    expect(sibling).toHaveTextContent('shell content');
    expect(document.body).toContainElement(host);
  });

  it('tolerates being unmounted twice', () => {
    let unmount: () => void = () => undefined;
    act(() => {
      unmount = mount(host, fakeBridge());
    });

    act(() => {
      unmount();
    });

    expect(() => {
      act(() => {
        unmount();
      });
    }).not.toThrow();
  });
});
