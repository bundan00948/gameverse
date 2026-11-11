import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), admin: {}, header: vi.fn() }));
vi.mock('@tanstack/react-start', () => ({ createServerFn: () => {
  const builder = { middleware: () => builder, inputValidator: () => builder, handler: (fn: unknown) => fn };
  return builder;
} }));
vi.mock('@tanstack/react-start/server', () => ({ setResponseHeader: mocks.header }));
vi.mock('@/integrations/supabase/auth-middleware', () => ({ requireSupabaseAuth: {} }));
vi.mock('@/integrations/supabase/client.server', () => ({ supabaseAdmin: mocks.admin }));
import { updateUser, deleteUser, setAccountBan, listGameLog } from '@/lib/admin.functions';
type Invoke = (input: { data: Record<string, unknown>; context: { userId: string; supabase: { rpc: typeof mocks.rpc } } }) => Promise<unknown>;
const invoke = (fn: unknown, data: Record<string, unknown>) => (fn as Invoke)({ data, context: { userId: 'staff', supabase: { rpc: mocks.rpc } } });
beforeEach(() => { mocks.rpc.mockReset(); mocks.rpc.mockImplementation(async (name: string, args: { _perm?: string }) => ({ data: name==='has_permission' && args._perm==='players.view', error: null })); });
describe('Server-side precise permissions', () => {
  it.each([
    ['profile', { username: 'Changed' }], ['tokens', { tokens: 500 }], ['password_reset', { password: 'ChangedPassword' }],
  ])('view-only staff cannot change %s', async (_permission, changes) => {
    await expect(invoke(updateUser, { id: 'target', ...changes })).rejects.toThrow('Permission denied');
  });
  it('view-only staff cannot delete accounts', async () => { await expect(invoke(deleteUser, { id: 'target' })).rejects.toThrow('Staff only'); });
  it('view-only staff cannot ban accounts', async () => { await expect(invoke(setAccountBan, { id: 'target', banned: true, reason: 'Test', hours: null })).rejects.toThrow('Staff only'); });
  it('view-only staff cannot read activity or IP logs', async () => { await expect(invoke(listGameLog, { page: 0, kind: 'all' })).rejects.toThrow('Staff only'); });
  it('banned staff cannot read activity despite a retained token', async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    await expect(invoke(listGameLog, { page: 0, kind: 'all' })).rejects.toThrow('Account unavailable');
  });
});