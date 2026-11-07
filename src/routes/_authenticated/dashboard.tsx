import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Search, ArrowLeft, Maximize, RotateCw, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { gamesOptions } from '@/features/dashboard/data';
import { gameEmbedUrl } from '@/features/dashboard/game-embed';
import { Empty, PageError, PageTitle, meta } from '@/features/dashboard/page';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: ({ context }) => context.queryClient.ensureQueryData(gamesOptions()),
  head: () => meta('Games', 'Browse GameVerse games and play directly in your browser.'),
  component: Games, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});
type Game = { id: string; title: string; description: string; image_url: string | null; play_url: string };
function Games() {
  const { data } = useSuspenseQuery(gamesOptions());
  const cache = useQueryClient();
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<Game | null>(null);
  const [reload, setReload] = useState(0);
  const [notice, setNotice] = useState('');
  const player = useRef<HTMLDivElement>(null);
  const play = useMutation({
    mutationFn: async (game: Game) => {
      const { error } = await supabase.rpc('record_play', { _game: game.id });
      if (error) throw error;
    },
    onSuccess: () => { ['history', 'stats', 'missions'].forEach(key => cache.invalidateQueries({ queryKey: [key] })); },
  });
  const visible = data.filter(game => game.title.toLowerCase().includes(search.toLowerCase()));
  const embed = active ? gameEmbedUrl(active.play_url) : null;
  function launch(game: Game) {
    if (!gameEmbedUrl(game.play_url)) return;
    setActive(game); setReload(0); setNotice(''); play.mutate(game);
  }
  return <DashboardShell bare>
    {active && embed ? <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-4">
        <div className="flex min-w-0 items-center gap-3"><Button variant="ghost" size="icon" aria-label="Back to games" title="Back to games" onClick={() => setActive(null)}><ArrowLeft /></Button><h1 className="min-w-0 break-words font-display text-2xl">{active.title}</h1></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Reload game" title="Reload game" onClick={() => setReload(n => n + 1)}><RotateCw /></Button>
          <Button variant="outline" size="icon" aria-label="Fullscreen" title="Fullscreen" onClick={async () => { try { if (player.current?.requestFullscreen) await player.current.requestFullscreen(); else setNotice('Fullscreen is not available in this browser.'); } catch { setNotice('Fullscreen is not available in this browser.'); } }}><Maximize /></Button>
          <Button asChild variant="outline" size="icon"><a href={embed} target="_blank" rel="noopener noreferrer" aria-label="Open game in new tab" title="Open game in new tab"><ExternalLink /></a></Button>
        </div>
      </div>
      <div ref={player} className="mt-4 aspect-video min-h-80 w-full overflow-hidden rounded-lg border border-surface-border bg-surface sm:min-h-96">
        <iframe key={`${active.id}-${reload}`} src={embed} title={active.title} className="block size-full border-0" allow="fullscreen; autoplay; gamepad" allowFullScreen sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-popups" referrerPolicy="no-referrer" />
      </div>
      {active.description && <p className="mt-4 max-w-3xl text-sm text-muted-foreground">{active.description}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>}
      {play.error && <p role="alert" className="mt-3 text-sm text-destructive">Could not save play history: {play.error.message}</p>}
    </> : <>
      <PageTitle kicker="Your universe" title="Games"><span className="text-sm font-bold text-muted-foreground">{data.length} games</span></PageTitle>
      <div className="mt-5 flex border-b border-surface-border pb-4"><label className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="Search games" placeholder="Search games…" value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-md border border-surface-border bg-surface py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label></div>
      {!visible.length ? <Empty>{data.length ? 'No games match your search.' : 'No games added yet.'}</Empty> :
      <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{visible.map(game => <div key={game.id} className="min-w-0">
        <Button variant="ghost" onClick={() => launch(game)} disabled={!gameEmbedUrl(game.play_url)} aria-label={`Play ${game.title}`} title={gameEmbedUrl(game.play_url) ? game.title : `${game.title} — coming soon`} className="aspect-square h-auto w-full overflow-hidden rounded-lg border border-surface-border bg-surface p-0 shadow-tile transition-transform hover:-translate-y-1 hover:bg-surface focus-visible:ring-2 disabled:opacity-60">
          {game.image_url && <img src={game.image_url} alt={game.title} loading="lazy" draggable={false} className="block size-full object-contain" />}
        </Button>
        <h2 className="mt-2 break-words text-center text-sm font-bold">{game.title}</h2>
        {!gameEmbedUrl(game.play_url) && <p className="mt-1 text-center text-xs text-muted-foreground">Coming soon</p>}
      </div>)}</div>}
    </>}
  </DashboardShell>;
}
