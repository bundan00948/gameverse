import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { gamesOptions } from '@/features/dashboard/data';
import { gameEmbedUrl } from '@/features/dashboard/game-embed';
import { Empty, PageError, PageTitle, meta } from '@/features/dashboard/page';

export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: ({ context }) => context.queryClient.ensureQueryData(gamesOptions()),
  head: () => meta('Games', 'Browse GameVerse games and play directly in your browser.'),
  component: Games, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});
const tile = 'group relative block aspect-square w-full overflow-hidden rounded-lg border border-surface-border bg-surface shadow-tile transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
function Games() {
  const { data } = useSuspenseQuery(gamesOptions());
  const [search, setSearch] = useState('');
  const visible = data.filter(game => game.title.toLowerCase().includes(search.toLowerCase()));
  return <DashboardShell bare>
    <PageTitle kicker="Your universe" title="Games"><span className="text-sm font-bold text-muted-foreground">{data.length} games</span></PageTitle>
    <div className="mt-5 flex border-b border-surface-border pb-4"><label className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="Search games" placeholder="Search games…" value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-md border border-surface-border bg-surface py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label></div>
    {!visible.length ? <Empty>{data.length ? 'No games match your search.' : 'No games added yet.'}</Empty> :
    <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">{visible.map(game => {
      const ready = !!gameEmbedUrl(game.play_url);
      const inner = <>
        {game.image_url && <img src={game.image_url} alt="" loading="lazy" decoding="async" draggable={false} className="block size-full object-contain" />}
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-overlay-background p-2 text-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="break-words text-xs font-bold text-overlay-foreground">{game.title}</span>
          {!ready && <span className="text-[10px] text-overlay-foreground">Coming soon</span>}
        </span>
      </>;
      return <div key={game.id} className="min-w-0">{ready
        ? <Link to="/play/$gameId" params={{ gameId: game.id }} reloadDocument aria-label={`Play ${game.title}`} title={game.title} className={`${tile} hover:-translate-y-1`}>{inner}</Link>
        : <span aria-label={`${game.title} — coming soon`} title={`${game.title} — coming soon`} className={`${tile} opacity-60`}>{inner}</span>}</div>;
    })}</div>}
  </DashboardShell>;
}
