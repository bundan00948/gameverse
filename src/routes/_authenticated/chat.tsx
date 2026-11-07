import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Reply, Send, Trash2, X, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { usePlayer } from '@/features/account/session';
import { chatOptions } from '@/features/dashboard/data';
import { PageError, PageTitle, meta } from '@/features/dashboard/page';
import { identitiesOptions, notificationsOptions, permissionsOptions, roleTextStyle, type Identity } from '@/features/dashboard/roles';
import { Button } from '@/components/ui/button';
import { BadgeList, PlayerAvatar, PlayerName } from '@/features/dashboard/player-identity';
import { playerName } from '@/features/dashboard/player-profile';

export const Route = createFileRoute('/_authenticated/chat')({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(chatOptions()), context.queryClient.ensureQueryData(identitiesOptions())]),
  head: () => meta('Chat', 'Chat with other GameVerse players.'),
  component: Chat, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

type Msg = { id: string; username: string; body: string; user_id: string; reply_to: string | null; created_at: string };

function Name({ name, identity }: { name: string; identity?: Identity | undefined }) {
  return <span className="inline-flex flex-wrap items-center gap-1.5">
    <PlayerName name={name} identity={identity} />
    {identity?.role && <span className="text-xs font-bold" style={roleTextStyle(identity.role.colors)}>[{identity.role.name}]</span>}
    <BadgeList identity={identity} />
  </span>;
}

function Chat() {
  const { data } = useSuspenseQuery(chatOptions()); const { data: ids } = useSuspenseQuery(identitiesOptions());
  const { data: perms = [] } = useQuery(permissionsOptions()); const { data: notes = [] } = useQuery(notificationsOptions());
  const cache = useQueryClient(); const user = usePlayer();
  const [text, setText] = useState(''); const [replyTo, setReplyTo] = useState<Msg | null>(null); const end = useRef<HTMLDivElement>(null); const box = useRef<HTMLInputElement>(null);
  const name = playerName(user ? ids.get(user.id) : undefined);
  const messageName = (m: Msg) => playerName(ids.get(m.user_id), m.username || 'Player');
  const byId = new Map(data.map(m => [m.id, m]));
  const send = useMutation({ mutationFn: async (body: string) => { const { error } = await supabase.from('chat_messages').insert({ body, username: name, reply_to: replyTo?.id ?? null }); if (error) throw error; }, onSuccess: () => { setText(''); setReplyTo(null); cache.invalidateQueries({ queryKey: ['chat'] }); cache.invalidateQueries({ queryKey: ['missions'] }); } });
  const del = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from('chat_messages').delete().eq('id', id); if (error) throw error; }, onSuccess: () => cache.invalidateQueries({ queryKey: ['chat'] }) });
  const unread = notes.filter(n => !n.read);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [data.length]);
  useEffect(() => { if (unread.length) void supabase.from('notifications').update({ read: true }).in('id', unread.map(n => n.id)).then(() => cache.invalidateQueries({ queryKey: ['notifications'] })); }, [unread.length, cache]); // eslint-disable-line react-hooks/exhaustive-deps
  return <DashboardShell>
    <PageTitle kicker="Global" title="Chat" />
    {unread.length > 0 && <p role="status" className="mt-2 flex items-center gap-2 text-sm font-bold text-tile-d"><Bell className="size-4" />{unread.length} new {unread.length === 1 ? 'reply' : 'replies'} to you</p>}
    <div className="gv-chat-log mt-6 overflow-y-auto rounded-xl border border-surface-border p-2">
      {data.length === 0 && <p className="text-center text-muted-foreground">No messages yet — say hi!</p>}
      {data.map(m => { const parent = m.reply_to ? byId.get(m.reply_to) : undefined; const mentionsMe = parent?.user_id === user?.id && m.user_id !== user?.id; return (
        <div key={m.id} className={`group relative flex gap-3 rounded-lg px-2 py-1.5 hover:bg-glass-hover ${mentionsMe ? 'border-l-4 border-tile-d bg-tile-d/15' : ''}`}>
          <Link to="/stats" search={{ player: m.user_id }} preload={false} aria-label={`View ${messageName(m)} profile`} className="shrink-0"><PlayerAvatar name={messageName(m)} identity={ids.get(m.user_id)} /></Link>
          <div className="min-w-0 flex-1">
            <p className="text-sm"><Link to="/stats" search={{ player: m.user_id }} preload={false} className="rounded-sm hover:underline"><Name name={messageName(m)} identity={ids.get(m.user_id)} /></Link> <span className="ml-1 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
            {m.reply_to && <p className="truncate text-xs text-muted-foreground"><Reply className="mr-1 inline size-3" />{parent ? <>@{messageName(parent)}: {parent.body}</> : 'Original message unavailable'}</p>}
            <p className="break-words text-sm">{m.body}</p>
          </div>
          <div className="gv-chat-actions absolute right-2 top-1 flex gap-1 rounded-md bg-surface p-0.5 shadow-tile">
            <Button variant="ghost" type="button" aria-label={`Reply to ${messageName(m)}`} title="Reply" onClick={() => { setReplyTo(m); box.current?.focus(); }} className="grid size-11 place-items-center rounded hover:bg-glass-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Reply className="size-4" /></Button>
            {perms.includes('chat') && <Button variant="ghost" type="button" aria-label="Delete message" title="Delete" onClick={() => del.mutate(m.id)} className="grid size-11 place-items-center rounded text-destructive hover:bg-glass-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 className="size-4" /></Button>}
          </div>
        </div>); })}
      <div ref={end} />
    </div>
    {replyTo && <div className="mt-3 flex items-center gap-2 rounded-t-lg bg-glass-hover px-3 py-1.5 text-xs"><Reply className="size-3.5" /><span className="min-w-0 flex-1 truncate">Replying to <b>@{messageName(replyTo)}</b>: {replyTo.body}</span><Button variant="ghost" type="button" aria-label="Cancel reply" onClick={() => setReplyTo(null)}><X className="size-4" /></Button></div>}
    <form className={`${replyTo ? '' : 'mt-3'} flex gap-2`} onSubmit={e => { e.preventDefault(); const b = text.trim(); if (b) send.mutate(b); }}>
      <label className="sr-only" htmlFor="chat-input">Message</label>
      <input ref={box} id="chat-input" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setReplyTo(null); }} maxLength={300} placeholder={replyTo ? `Reply to ${messageName(replyTo)}…` : 'Type a message…'} className="h-12 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-sm" />
      <Button variant="ghost" type="submit" disabled={send.isPending || !text.trim()} aria-label="Send message" className="grid size-12 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"><Send className="size-4" /></Button>
    </form>
    {(send.error || del.error) && <p role="alert" className="mt-2 text-destructive">{(send.error ?? del.error)?.message}</p>}
  </DashboardShell>;
}
