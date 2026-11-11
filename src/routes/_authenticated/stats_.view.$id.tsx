import { createFileRoute, notFound } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { statsOptions } from '@/features/dashboard/data';
import { identitiesOptions } from '@/features/dashboard/roles';
import { PageError, meta } from '@/features/dashboard/page';
import { StatsView } from './stats';

export const Route = createFileRoute('/_authenticated/stats_/view/$id')({
  loader: async ({ context, params }) => {
    if (!/^\d{7}$/.test(params.id)) throw notFound();
    const r = await supabase.from('profiles').select('id').eq('code_id', params.id).maybeSingle();
    let player = r.data?.id;
    if (!player) { const all = await supabase.rpc('player_codes'); player = all.data?.find(c => c.code_id === params.id)?.user_id; }
    if (!player) throw notFound();
    await Promise.all([context.queryClient.ensureQueryData(statsOptions(player)), context.queryClient.ensureQueryData(identitiesOptions())]);
    return { player };
  },
  head: ({ params }) => meta(`Player #${params.id}`, `GameVerse stats for player #${params.id}.`),
  component: () => <StatsView player={Route.useLoaderData().player} />,
  errorComponent: PageError,
  notFoundComponent: () => <p className="p-8 text-center">No player has that ID.</p>,
});
