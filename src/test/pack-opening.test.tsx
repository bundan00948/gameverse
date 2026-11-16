import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PackOpener, type Pack } from '@/features/dashboard/pack-opener';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn(async () => ({ data: [{ id: 'robot', name: 'Robot', rarity: 'rare' }], error: null })) } }));
vi.mock('@/features/dashboard/data', () => ({ appearanceOptions: () => ({ queryKey: ['test-appearance'], queryFn: async () => ({ rare: '#329be9' }) }), rarityBadgesOptions: () => ({ queryKey: ['test-badges'], queryFn: async () => ({ rare: null }) }) }));
const pack: Pack = { id: 'space', name: 'Space Pack', price: 25, image_url: null, gradient_start: '#17b9cc', gradient_end: '#308ee5', open_image_url: null, pattern_image_url: null, blooks: [{ id: 'robot', name: 'Robot', image_url: null, rarity: 'rare', weight: 10 }] };
afterEach(cleanup);
describe('purchased pack opening', () => {
  it('blocks dismissal during opening and allows clicking the finished result to exit', async () => {
    const close = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><PackOpener pack={pack} tokens={100} onClose={close} /></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: /Buy 1 for/ }));
    await screen.findByRole('button', { name: /^Open / });
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /^Open / }));
    const back = await screen.findByRole('button', { name: 'Close pack result' }, { timeout: 1000 });
    fireEvent.click(back);
    expect(close).toHaveBeenCalledTimes(1);
    client.clear();
  });
  it('reveals all purchased packs sequentially with no additional charges', async () => {
    vi.mocked(supabase.rpc).mockClear();
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [{ id: 'robot', name: 'Robot', rarity: 'rare' }, { id: 'robot', name: 'Robot', rarity: 'rare' }], error: null, success: true, count: null, status: 200, statusText: 'OK' });
    const close = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><PackOpener pack={pack} tokens={100} onClose={close} /></QueryClientProvider>);
    fireEvent.change(screen.getByLabelText('Purchase Quantity:'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /Buy 2 for/ }));
    fireEvent.click(await screen.findByRole('button', { name: /^Open / }));
    fireEvent.click(await screen.findByRole('button', { name: 'Next pack' }));
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('button', { name: /^Open / }));
    fireEvent.click(await screen.findByRole('button', { name: 'Close pack result' }));
    expect(close).toHaveBeenCalledTimes(1);
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('open_packs', { _pack: 'space', _quantity: 2 });
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