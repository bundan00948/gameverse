import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Reply, Send, Trash2, X, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { usePlayer } from '@/features/account/session';
import { chatOptions } from '@/features/dashboard/data';
import { PageError, PageTitle, meta } from '@/features/dashboard/page';
import { identitiesOptions, notificationsOptions, permissionsOptions, roleGradient, type Identity } from '@/features/dashboard/roles';

export const Route = createFileRoute('/_authenticated/chat')({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(chatOptions()), context.queryClient.ensureQueryData(identitiesOptions())]),
  head: () => meta('Chat', 'Chat with other GameVerse players.'),
  component: Chat, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

type Msg = ReturnType<typeof chatOptions> extends { queryFn?: infer F } ? F extends (...a: never[]) => Promise<infer R> ? R extends (infer M)[] ? M : never : never : never;

function Name({ name, identity }: { name: string; identity?: Identity }) {
  const paint = roleGradient(identity?.role?.colors);
  const style = paint ? { backgroundImage: paint.startsWith('#') ? undefined : paint, color: paint.startsWith('#') ? paint : 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text' } : undefined;
  return <span className="inline-flex flex-wrap items-center gap-1.5">
    <span className="font-bold" style={style}>{name}</span>
    {identity?.role && <span className="text-xs font-bold" style={style}>[{identity.role.name}]</span>}
    {identity?.badges.map(b => b.image_url ? <img key={b.id} src={b.image_url} alt={b.name} title={b.name} className="size-4 object-contain" /> : <span key={b.id} title={b.name} className="rounded bg-glass-hover px-1 text-[10px] font-bold">{b.name}</span>)}
  </span>;
}

function Chat() {
  const { data } = useSuspenseQuery(chatOptions()); const { data: ids } = useSuspenseQuery(identitiesOptions());
  const { data: perms = [] } = useQuery(permissionsOptions()); const { data: notes = [] } = useQuery(notificationsOptions());
  const cache = useQueryClient(); const user = usePlayer();
  const [text, setText] = useState(''); const [replyTo, setReplyTo] = useState<Msg | null>(null); const end = useRef<HTMLDivElement>(null); const box = useRef<HTMLInputElement>(null);
  const name = (user?.user_metadata?.['username'] as string | undefined) || user?.email?.split('@')[0] || 'Player';
  const byId = new Map(data.map(m => [m.id, m]));
  const send = useMutation({ mutationFn: async (body: string) => { const { error } = await supabase.from('chat_messages').insert({ body, username: name, reply_to: replyTo?.id ?? null }); if (error) throw error; }, onSuccess: () => { setText(''); setReplyTo(null); cache.invalidateQueries({ queryKey: ['chat'] }); cache.invalidateQueries({ queryKey: ['missions'] }); } });
  const del = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from('chat_messages').delete().eq('id', id); if (error) throw error; }, onSuccess: () => cache.invalidateQueries({ queryKey: ['chat'] }) });
  const unread = notes.filter(n => !n.read);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [data.length]);
  useEffect(() => { if (unread.length) void supabase.from('notifications').update({ read: true }).in('id', unread.map(n => n.id)).then(() => cache.invalidateQueries({ queryKey: ['notifications'] })); }, [unread.length, cache]); // eslint-disable-line react-hooks/exhaustive-deps
  return <DashboardShell>
    <PageTitle kicker="Global" title="Chat" />
    {unread.length > 0 && <p role="status" className="mt-2 flex items-center gap-2 text-sm font-bold text-tile-d"><Bell className="size-4" />{unread.length} new {unread.length === 1 ? 'reply' : 'replies'} to you</p>}
    <div className="mt-4 h-[50vh] overflow-y-auto rounded-xl border border-surface-border p-2">
      {data.length === 0 && <p className="text-center text-muted-foreground">No messages yet — say hi!</p>}
      {data.map(m => { const parent = m.reply_to ? byId.get(m.reply_to) : undefined; const mentionsMe = parent?.user_id === user?.id && m.user_id !== user?.id; return (
        <div key={m.id} className={`group relative flex gap-3 rounded-lg px-2 py-1.5 hover:bg-glass-hover ${mentionsMe ? 'border-l-4 border-tile-d bg-tile-d/15' : ''}`}>
          <span className="font-display grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">{(m.username || 'P')[0]?.toUpperCase()}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm"><Name name={m.username || 'Player'} identity={ids.get(m.user_id)} /> <span className="ml-1 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
            {m.reply_to && <p className="truncate text-xs text-muted-foreground"><Reply className="mr-1 inline size-3" />{parent ? <>@{parent.username || 'Player'}: {parent.body}</> : 'Original message unavailable'}</p>}
            <p className="break-words text-sm">{m.body}</p>
          </div>
          <div className="absolute right-2 top-1 hidden gap-1 rounded-md bg-surface p-0.5 shadow-tile group-hover:flex group-focus-within:flex">
            <button type="button" aria-label={`Reply to ${m.username || 'Player'}`} title="Reply" onClick={() => { setReplyTo(m); box.current?.focus(); }} className="grid size-7 place-items-center rounded hover:bg-glass-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Reply className="size-4" /></button>
            {perms.includes('chat') && <button type="button" aria-label="Delete message" title="Delete" onClick={() => del.mutate(m.id)} className="grid size-7 place-items-center rounded text-destructive hover:bg-glass-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 className="size-4" /></button>}
          </div>
        </div>); })}
      <div ref={end} />
    </div>
    {replyTo && <div className="mt-3 flex items-center gap-2 rounded-t-lg bg-glass-hover px-3 py-1.5 text-xs"><Reply className="size-3.5" /><span className="min-w-0 flex-1 truncate">Replying to <b>@{replyTo.username || 'Player'}</b>: {replyTo.body}</span><button type="button" aria-label="Cancel reply" onClick={() => setReplyTo(null)}><X className="size-4" /></button></div>}
    <form className={`${replyTo ? '' : 'mt-3'} flex gap-2`} onSubmit={e => { e.preventDefault(); const b = text.trim(); if (b) send.mutate(b); }}>
      <label className="sr-only" htmlFor="chat-input">Message</label>
      <input ref={box} id="chat-input" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setReplyTo(null); }} maxLength={300} placeholder={replyTo ? `Reply to ${replyTo.username || 'Player'}…` : 'Type a message…'} className="h-10 flex-1 rounded-lg border border-input bg-card px-3 text-sm" />
      <button type="submit" disabled={send.isPending || !text.trim()} aria-label="Send message" className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"><Send className="size-4" /></button>
    </form>
    {(send.error || del.error) && <p role="alert" className="mt-2 text-destructive">{(send.error ?? del.error)?.message}</p>}
  </DashboardShell>;
}
