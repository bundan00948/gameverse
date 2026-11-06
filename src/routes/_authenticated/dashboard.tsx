import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { gamesOptions } from '@/features/dashboard/data';
import { Empty, PageError, PageTitle, card, meta } from '@/features/dashboard/page';

export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: ({ context }) => context.queryClient.ensureQueryData(gamesOptions()),
  head: () => meta('Games', 'Play games in your GameVerse library.'),
  component: Games, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

function Games() {
  const { data } = useSuspenseQuery(gamesOptions()); const cache = useQueryClient();
  const play = useMutation({
    mutationFn: async (g: { id: string; play_url: string }) => { const { error } = await supabase.rpc('record_play', { _game: g.id }); if (error) throw error; if (g.play_url) window.open(g.play_url, '_blank', 'noopener'); },
    onSuccess: () => { cache.invalidateQueries({ queryKey: ['history'] }); cache.invalidateQueries({ queryKey: ['stats'] }); cache.invalidateQueries({ queryKey: ['missions'] }); },
  });
  return <DashboardShell>
    <PageTitle kicker="Your universe" title="Games" />
    {data.length === 0 ? <Empty>No games added yet.</Empty> :
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.map(g => (
      <article key={g.id} className={card}>
        <div className="text-5xl">{g.emoji}</div>
        <h2 className="mt-3 text-xl font-bold">{g.title}</h2>
        <p className="mt-1 min-h-10 text-sm text-muted-foreground">{g.description}</p>
        <button type="button" disabled={play.isPending} onClick={() => play.mutate(g)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-bold text-primary-foreground transition hover:-translate-y-0.5 disabled:opacity-60"><Play className="size-4" />Play</button>
        {play.isSuccess && play.variables?.id === g.id && <p role="status" className="mt-2 text-xs text-muted-foreground">{g.play_url ? 'Opened — added to your history.' : 'Added to your history (game link coming soon).'}</p>}
      </article>))}</div>}
    {play.error && <p role="alert" className="mt-4 text-destructive">{play.error.message}</p>}
  </DashboardShell>;
}
