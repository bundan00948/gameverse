import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { playerId } from '@/features/account/auth-user';
import { Mail, X } from '@/lib/icons';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export interface MailItem { id: string; user_id: string | null; kind: string; title: string; body: string; image_url: string | null; created_at: string; read: boolean }
export const mailOptions = () => queryOptions({ queryKey: ['mail'], staleTime: 20_000, refetchInterval: 30_000, refetchIntervalInBackground: false, queryFn: async (): Promise<MailItem[]> => {
  const id = await playerId();
  const [mail, reads] = await Promise.all([
    supabase.from('mail').select('id, user_id, kind, title, body, image_url, created_at').or(`user_id.eq.${id},user_id.is.null`).order('created_at', { ascending: false }).limit(50),
    supabase.from('mail_reads').select('mail_id').eq('user_id', id),
  ]);
  if (mail.error) throw mail.error;
  const seen = new Set((reads.data ?? []).map(r => r.mail_id));
  return mail.data.map(m => ({ ...m, read: seen.has(m.id) }));
} });

const kindLabel: Record<string, string> = { system: 'System notice', sale: 'Bazaar sale', auction: 'Auction' };
export function timeAgo(iso: string) {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  const [n, u] = s < 3600 ? [s / 60, 'minute'] : s < 86400 ? [s / 3600, 'hour'] : [s / 86400, 'day'];
  const v = Math.max(1, Math.floor(n)); return `${v} ${u}${v === 1 ? '' : 's'} ago`;
}

/** Mail button with unread count; opens a right-side mail drawer. */
export function Mailbox() {
  const cache = useQueryClient(); const [open, setOpen] = useState(false);
  const { data: mail = [] } = useQuery(mailOptions());
  const unread = mail.filter(m => !m.read);
  const openBox = async () => {
    setOpen(true);
    if (unread.length) {
      const id = await playerId();
      await supabase.from('mail_reads').upsert(unread.map(m => ({ user_id: id, mail_id: m.id })), { ignoreDuplicates: true });
      void cache.invalidateQueries({ queryKey: ['mail'] });
    }
  };
  return <>
    <button type="button" onClick={openBox} aria-label={unread.length ? `Mail, ${unread.length} unread` : 'Mail'} className="relative grid size-11 shrink-0 place-items-center rounded-md hover:bg-glass-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Mail className="size-5" />{unread.length > 0 && <span aria-hidden className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread.length}</span>}
    </button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent aria-describedby={undefined} className="mail-drawer">
        <header className="flex items-center gap-3 bg-primary px-5 py-4 text-primary-foreground"><Mail className="size-7" /><DialogTitle className="flex-1 font-display text-3xl">GameVerse Mail</DialogTitle><button type="button" onClick={() => setOpen(false)} aria-label="Close mail" className="grid size-10 place-items-center rounded-md hover:bg-black/15"><X className="size-7" /></button></header>
        <div className="flex-1 space-y-4 overflow-y-auto bg-background/60 p-4">
          {mail.length === 0 && <p className="py-10 text-center text-muted-foreground">No mail yet.</p>}
          {mail.map(m => <article key={m.id} className="rounded-xl border border-surface-border bg-surface p-4 shadow-tile">
            <p className="text-xs font-bold text-muted-foreground">{kindLabel[m.kind] ?? 'Notice'}{unread.some(u => u.id === m.id) && <span className="ml-2 rounded-full bg-destructive px-1.5 text-[10px] text-destructive-foreground">NEW</span>}</p>
            <h3 className="mt-0.5 font-display text-xl">{m.title}</h3>
            {m.image_url && <img src={m.image_url} alt="" loading="lazy" className="mt-3 w-full rounded-lg object-cover" />}
            {m.body && <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">{m.body}</p>}
            <p className="mt-3 text-xs text-muted-foreground">{timeAgo(m.created_at)}</p>
          </article>)}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
