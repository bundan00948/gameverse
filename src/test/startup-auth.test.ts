import { describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth } }));
import { playerId } from '@/features/account/auth-user';

describe('Browser query identity', () => {
  it('uses the session ID without an additional remote user request', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'player-123' } } }, error: null });
    expect(await playerId()).toBe('player-123');
    expect(auth.getUser).not.toHaveBeenCalled();
  });
  it('rejects queries when there is no signed-in session', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(playerId()).rejects.toThrow('Please sign in again.');
  });
});