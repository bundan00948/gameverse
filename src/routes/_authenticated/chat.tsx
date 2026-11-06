import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { usePlayer } from '@/features/account/session';
import { chatOptions } from '@/features/dashboard/data';
import { PageError, PageTitle, meta } from '@/features/dashboard/page';

export const Route = createFileRoute('/_authenticated/chat')({
  loader: ({ context }) => context.queryClient.ensureQueryData(chatOptions()),
  head: () => meta('Chat', 'Chat with other GameVerse players.'),
  component: Chat, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

function Chat() {
  const { data } = useSuspenseQuery(chatOptions()); const cache = useQueryClient(); const user = usePlayer();
  const [text, setText] = useState(''); const end = useRef<HTMLDivElement>(null);
  const name = (user?.user_metadata?.['username'] as string | undefined) || user?.email?.split('@')[0] || 'Player';
  const send = useMutation({ mutationFn: async (body: string) => { const { error } = await supabase.from('chat_messages').insert({ body, username: name }); if (error) throw error; }, onSuccess: () => { setText(''); cache.invalidateQueries({ queryKey: ['chat'] }); cache.invalidateQueries({ queryKey: ['missions'] }); } });
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [data.length]);
  return <DashboardShell>
    <PageTitle kicker="Global" title="Chat" />
    <div className="mt-4 h-[42vh] space-y-2.5 overflow-y-auto rounded-xl border border-surface-border p-3">
      {data.length === 0 && <p className="text-center text-muted-foreground">No messages yet — say hi!</p>}
      {data.map(m => { const mine = m.user_id === user?.id; return (
        <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
          <span className="text-xs text-muted-foreground">{m.username || 'Player'} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <p className={`mt-1 max-w-[80%] break-words rounded-xl px-4 py-2 ${mine ? 'bg-primary text-primary-foreground' : 'bg-glass-hover'}`}>{m.body}</p>
        </div>); })}
      <div ref={end} />
    </div>
    <form className="mt-4 flex gap-2" onSubmit={e => { e.preventDefault(); const b = text.trim(); if (b) send.mutate(b); }}>
      <label className="sr-only" htmlFor="chat-input">Message</label>
      <input id="chat-input" value={text} onChange={e => setText(e.target.value)} maxLength={300} placeholder="Type a message…" className="h-12 flex-1 rounded-lg border border-input bg-card px-4" />
      <button type="submit" disabled={send.isPending || !text.trim()} aria-label="Send message" className="grid size-12 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"><Send className="size-5" /></button>
    </form>
    {send.error && <p role="alert" className="mt-2 text-destructive">{send.error.message}</p>}
  </DashboardShell>;
}
