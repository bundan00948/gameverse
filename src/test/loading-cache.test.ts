import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const backend = vi.hoisted(() => ({
  rpc: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn(),
  from: vi.fn(),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: backend.rpc, auth: { getUser: backend.getUser, getSession: backend.getSession }, from: backend.from },
}));

import { statsOptions, walletOptions } from '@/features/dashboard/data';

describe('Shared loading cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    backend.rpc.mockResolvedValue({ data: { tokens: 100, packs_opened: 2 }, error: null });
    backend.getUser.mockResolvedValue({ data: { user: { id: 'player' } }, error: null });
    backend.getSession.mockResolvedValue({ data: { session: { user: { id: 'player' } } }, error: null });
    backend.from.mockImplementation(() => ({
      select: () => ({
        count: 10,
        eq: () => Promise.resolve({ data: [{ quantity: 1 }], count: 3, error: null }),
      }),
    }));
  });

  it('reuses the Market balance for Stats and the header instead of calling the wallet twice', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await client.ensureQueryData(walletOptions());
    const stats = await client.fetchQuery(statsOptions());
    expect(stats.tokens).toBe(100);
    expect(backend.rpc).toHaveBeenCalledTimes(1);
    expect(backend.rpc).toHaveBeenCalledWith('ensure_wallet');
    expect(backend.getUser).not.toHaveBeenCalled();
    client.clear();
  });

  it('refreshes a cached balance after a purchase invalidates it', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await client.fetchQuery(walletOptions());
    backend.rpc.mockResolvedValue({ data: { tokens: 75, packs_opened: 3 }, error: null });
    await client.invalidateQueries({ queryKey: ['wallet'] });
    const wallet = await client.fetchQuery(walletOptions());
    expect(wallet.tokens).toBe(75);
    expect(backend.rpc).toHaveBeenCalledTimes(2);
    client.clear();
  });
});