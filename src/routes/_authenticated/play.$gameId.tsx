import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Maximize, RotateCw, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { gameEmbedUrl } from '@/features/dashboard/game-embed';
import { Empty, PageError, meta } from '@/features/dashboard/page';
import { Button } from '@/components/ui/button';
import { useServerFn } from '@tanstack/react-start';
import { recordGameOpen } from '@/lib/account-safety.functions';

const gameOptions = (id: string) => queryOptions({ queryKey: ['game', id], staleTime: 60_000, queryFn: async () => {
  const { data, error } = await supabase.from('games').select('id, title, description, image_url, play_url').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
} });

export const Route = createFileRoute('/_authenticated/play/$gameId')({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(gameOptions(params.gameId)),
  head: ({ loaderData }) => meta(loaderData?.title ?? 'Game', loaderData?.description || 'Play this GameVerse game in your browser.'),
  component: Play, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

function Play() {
  const { gameId } = Route.useParams();
  const { data: game } = useSuspenseQuery(gameOptions(gameId));
  const cache = useQueryClient();
  const [reload, setReload] = useState(0);
  const [notice, setNotice] = useState('');
  const player = useRef<HTMLDivElement>(null);
  const embed = game ? gameEmbedUrl(game.play_url) : null;
  const record = useServerFn(recordGameOpen);
  const play = useMutation({
    mutationFn: (id: string) => record({ data: { gameId: id } }),
    onSuccess: () => { ['history', 'stats', 'missions'].forEach(key => cache.invalidateQueries({ queryKey: [key] })); },
  });
  const { mutate } = play;
  useEffect(() => { if (game && embed) mutate(game.id); }, [game, embed, mutate]);
  if (!game || !embed) return <DashboardShell bare><Link to="/dashboard" reloadDocument className="text-sm font-bold underline">Back to games</Link><Empty>{game ? 'This game is coming soon.' : 'Game not found.'}</Empty></DashboardShell>;
  return <DashboardShell bare>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-4">
      <div className="flex min-w-0 items-center gap-3"><Button asChild variant="ghost" size="icon"><Link to="/dashboard" reloadDocument aria-label="Back to games" title="Back to games"><ArrowLeft /></Link></Button><h1 className="min-w-0 break-words font-display text-2xl">{game.title}</h1></div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Reload game" title="Reload game" onClick={() => setReload(n => n + 1)}><RotateCw /></Button>
        <Button variant="outline" size="icon" aria-label="Fullscreen" title="Fullscreen" onClick={async () => { try { if (player.current?.requestFullscreen) await player.current.requestFullscreen(); else setNotice('Fullscreen is not available in this browser.'); } catch { setNotice('Fullscreen is not available in this browser.'); } }}><Maximize /></Button>
        <Button asChild variant="outline" size="icon"><a href={embed} target="_blank" rel="noopener noreferrer" aria-label="Open game in new tab" title="Open game in new tab"><ExternalLink /></a></Button>
      </div>
    </div>
    <div ref={player} className="mt-4 aspect-video min-h-80 w-full overflow-hidden rounded-lg border border-surface-border bg-surface sm:min-h-96">
      <iframe key={reload} src={embed} title={game.title} className="block size-full border-0" loading="lazy" allow="fullscreen; autoplay; gamepad" allowFullScreen sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-popups" referrerPolicy="no-referrer" />
    </div>
    {game.description && <p className="mt-4 max-w-3xl text-sm text-muted-foreground">{game.description}</p>}
    {notice && <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>}
    {play.error && <p role="alert" className="mt-3 text-sm text-destructive">Could not save play history: {play.error.message}</p>}
  </DashboardShell>;
}
