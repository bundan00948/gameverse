import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Public: exchanges a one-time login link key for a sign-in token. The key itself is the credential. */
export const redeemAuthLink = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ key: z.string().regex(/^[0-9a-f]{48}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const hash = await sha256(data.key);
    const { data: row } = await supabaseAdmin.from('auth_links').update({ used_at: new Date().toISOString() })
      .eq('token_hash', hash).is('used_at', null).gt('expires_at', new Date().toISOString()).select('user_id').maybeSingle();
    if (!row) return { error: 'This login link is invalid, used or expired.' as string, tokenHash: null };
    const user = await supabaseAdmin.auth.admin.getUserById(row.user_id);
    const email = user.data.user?.email;
    if (!email) return { error: 'This account cannot use login links.', tokenHash: null };
    const link = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email });
    if (link.error || !link.data.properties?.hashed_token) return { error: 'Could not sign you in. Try again.', tokenHash: null };
    return { error: null, tokenHash: link.data.properties.hashed_token };
  });
