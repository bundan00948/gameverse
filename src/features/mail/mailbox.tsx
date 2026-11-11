import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { playerId } from '@/features/account/auth-user';
import { Mail, X, Gavel, Store, Sparkles } from '@/lib/icons';
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

const kinds: Record<string, { label: string; icon: typeof Mail; tone: string }> = {
  system: { label: 'Announcement', icon: Sparkles, tone: 'var(--primary)' },
  sale: { label: 'Bazaar sale', icon: Store, tone: 'var(--tile-c, #22c55e)' },
  auction: { label: 'Auction', icon: Gavel, tone: 'var(--tile-d, #f59e0b)' },
};
const systemKind = { label: 'Announcement', icon: Sparkles, tone: 'var(--primary)' };
const filters = [['all', 'All'], ['system', 'News'], ['trade', 'Trades']] as const;
export function timeAgo(iso: string) {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  const [n, u] = s < 3600 ? [s / 60, 'minute'] : s < 86400 ? [s / 3600, 'hour'] : [s / 86400, 'day'];
  const v = Math.max(1, Math.floor(n)); return `${v} ${u}${v === 1 ? '' : 's'} ago`;
}

/** Mail button with unread count; opens a right-side mail drawer. */
export function Mailbox() {
  const cache = useQueryClient(); const [open, setOpen] = useState(false); const [filter, setFilter] = useState<(typeof filters)[number][0]>('all'); const [fresh, setFresh] = useState<Set<string>>(new Set());
  const { data: mail = [] } = useQuery(mailOptions());
  const unread = mail.filter(m => !m.read);
  const openBox = async () => {
    setOpen(true); setFresh(new Set(unread.map(m => m.id)));
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
        <DialogTitle className="sr-only">GameVerse Mail</DialogTitle>
        <div role="tablist" aria-label="Mail filter" className="mail-filters">{filters.map(([k, label]) => <button key={k} role="tab" type="button" aria-selected={filter === k} onClick={() => setFilter(k)} className="mail-filter">{label}</button>)}<button type="button" onClick={() => setOpen(false)} aria-label="Close mail" className="ml-auto grid size-8 place-items-center rounded-full hover:bg-glass-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="size-4" /></button></div>
        <div className="mail-list">
          {(() => { const list = mail.filter(m => filter === 'all' || (filter === 'system' ? m.kind === 'system' : m.kind !== 'system'));
            if (!list.length) return <div className="mail-empty"><span><Mail className="size-9" /></span><p className="font-display text-xl">No mail here</p><p className="text-sm text-muted-foreground">News and trade updates will land in this box.</p></div>;
            return list.map(m => { const k = kinds[m.kind] ?? systemKind; const isNew = fresh.has(m.id);
              return <article key={m.id} className="mail-card" data-new={isNew || undefined} style={{ '--mail-tone': k.tone } as React.CSSProperties}>
                <div className="flex items-center gap-2.5"><span className="flex-1" />{isNew && <span className="mail-new">New</span>}<time dateTime={m.created_at} className="text-[11px] font-semibold text-muted-foreground">{timeAgo(m.created_at)}</time></div>
                <h3 className="mt-2.5 font-display text-xl leading-tight">{m.title}</h3>
                {m.image_url && <div className="mail-image"><img src={m.image_url} alt="" loading="lazy" /></div>}
                {m.body && <p className="mt-2.5 whitespace-pre-line text-[14.5px] leading-relaxed text-foreground/85">{m.body}</p>}
                
              </article>; }); })()}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
