import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ImagePicker } from '@/features/dashboard/image-picker';
import { timeAgo } from '@/features/mail/mailbox';

const input = 'mt-1 w-full rounded-md border border-surface-border bg-background px-3 py-2 text-sm';
/** Staff compose system notices (optionally with a picture) that every player receives. */
export function MailPanel() {
  const cache = useQueryClient();
  const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [image, setImage] = useState<string | null>(null);
  const { data: sent = [] } = useQuery({ queryKey: ['admin-mail'], queryFn: async () => { const r = await supabase.from('mail').select('id, title, body, image_url, created_at').is('user_id', null).order('created_at', { ascending: false }).limit(30); if (r.error) throw r.error; return r.data; } });
  const done = () => { void cache.invalidateQueries({ queryKey: ['admin-mail'] }); void cache.invalidateQueries({ queryKey: ['mail'] }); };
  const send = useMutation({ mutationFn: async () => { const { error } = await supabase.from('mail').insert({ title: title.trim(), body: body.trim(), image_url: image, kind: 'system', user_id: null }); if (error) throw error; }, onSuccess: () => { setTitle(''); setBody(''); setImage(null); done(); } });
  const del = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from('mail').delete().eq('id', id); if (error) throw error; }, onSuccess: done });
  return <section className="space-y-4">
    <h2 className="font-display text-2xl">System mail</h2>
    <p className="text-sm text-muted-foreground">Notices go to every player's mailbox.</p>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3">
        <label className="block text-sm font-bold">Title<input className={input} maxLength={120} value={title} onChange={e => setTitle(e.target.value)} /></label>
        <label className="block text-sm font-bold">Message<textarea className={input} rows={6} maxLength={4000} value={body} onChange={e => setBody(e.target.value)} /></label>
        <ImagePicker label="Notice picture" value={image} onChange={setImage} />
        {send.error && <p role="alert" className="text-destructive">{send.error.message}</p>}
        <Button disabled={!title.trim() || send.isPending} onClick={() => send.mutate()}>{send.isPending ? 'Sending…' : 'Send to everyone'}</Button>
      </div>
      <article aria-label="Preview" className="rounded-xl border border-surface-border bg-surface p-4 shadow-tile"><p className="text-xs font-bold text-muted-foreground">System notice · Preview</p><h3 className="font-display text-xl">{title || 'Title'}</h3>{image && <img src={image} alt="" className="mt-3 w-full rounded-lg" />}<p className="mt-3 whitespace-pre-line text-[15px]">{body || 'Your message'}</p></article>
    </div>
    <h3 className="font-display text-xl">Sent</h3>
    {sent.map(m => <div key={m.id} className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface p-3"><div className="min-w-0 flex-1"><p className="truncate font-bold">{m.title}</p><p className="text-xs text-muted-foreground">{timeAgo(m.created_at)}</p></div><Button variant="outline" disabled={del.isPending} onClick={() => confirm('Delete this notice for everyone?') && del.mutate(m.id)}>Delete</Button></div>)}
  </section>;
}
