import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterContextProvider } from '@tanstack/react-router';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SiteHeader } from '@/components/site-header';
import { routeTree } from '@/routeTree.gen';

// The router only has to exist so Link can resolve; no match is rendered, so no
// page loader runs and the header stays isolated from the network.
function renderHeader() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    context: { queryClient: new QueryClient() },
  });
  return render(
    <RouterContextProvider router={router}>
      <SiteHeader />
    </RouterContextProvider>,
  );
}

afterEach(cleanup);

describe('Public site header', () => {
  it('offers no bright-mode switch outside Settings', () => {
    renderHeader();
    expect(screen.queryByRole('button', { name: /switch to (bright|dark) colors/i })).not.toBeInTheDocument();
  });

  it('still offers sign in', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
  });
});
