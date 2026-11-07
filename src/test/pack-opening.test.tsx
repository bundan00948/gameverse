import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PackOpener, type Pack } from '@/features/dashboard/pack-opener';

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
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Back to Market' })[0]!).toBeInTheDocument(), { timeout: 3000 });
    fireEvent.click(screen.getAllByRole('button', { name: 'Back to Market' })[0]!);
    expect(close).toHaveBeenCalledTimes(1);
    client.clear();
  });
});