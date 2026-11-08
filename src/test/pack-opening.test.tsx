import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PackOpener, type Pack } from '@/features/dashboard/pack-opener';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn(async () => ({ data: [{ id: 'robot', name: 'Robot', rarity: 'rare' }], error: null })) } }));
vi.mock('@/features/dashboard/data', () => ({ appearanceOptions: () => ({ queryKey: ['test-appearance'], queryFn: async () => ({ rare: '#329be9' }) }) }));
const pack: Pack = { id: 'space', name: 'Space Pack', price: 25, image_url: null, gradient_start: '#17b9cc', gradient_end: '#308ee5', open_image_url: null, pattern_image_url: null, blooks: [{ id: 'robot', name: 'Robot', image_url: null, rarity: 'rare', weight: 10 }] };
afterEach(cleanup);
describe('purchased pack opening', () => {
  it('keeps purchased pulls open on Escape until the player returns to Market', async () => {
    const close = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><PackOpener pack={pack} tokens={100} onClose={close} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: /Buy 1 for/ }));
    await screen.findByRole('button', { name: /^Open / });
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /^Open / }));
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Back to Market' }).length).toBeGreaterThan(0), { timeout: 3000 });
    const back = screen.getAllByRole('button', { name: 'Back to Market' })[0];
    if (!back) throw new Error('Missing return action');
    fireEvent.click(back);
    expect(close).toHaveBeenCalledTimes(1);
    client.clear();
  });
  it('charges once and waits for a click before revealing the purchased pull', async () => {
    vi.mocked(supabase.rpc).mockClear();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><PackOpener pack={pack} tokens={100} onClose={vi.fn()} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: /Buy 1 for/ }));
    const open = await screen.findByRole('button', { name: /^Open / });
    await new Promise(resolve => setTimeout(resolve, 1800));
    expect(open).toBeEnabled();
    expect(screen.queryByRole('heading', { name: 'Robot' })).not.toBeInTheDocument();
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('open_packs', { _pack: 'space', _quantity: 1 });
    fireEvent.click(open);
    await screen.findByRole('heading', { name: 'Robot' }, { timeout: 3000 });
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
    client.clear();
  });
});