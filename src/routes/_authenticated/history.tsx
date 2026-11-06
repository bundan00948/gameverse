import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { historyOptions } from '@/features/dashboard/data';
import { Empty, PageError, PageTitle, meta } from '@/features/dashboard/page';

export const Route = createFileRoute('/_authenticated/history')({
  loader: ({ context }) => context.queryClient.ensureQueryData(historyOptions()),
  head: () => meta('History', 'Games you have played on GameVerse.'),
  component: History, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

function History() {
  const { data } = useSuspenseQuery(historyOptions());
  return <DashboardShell>
    <PageTitle kicker="Recently played" title="History" />
    {data.length === 0 ? <Empty>You haven't played any games yet.</Empty> :
    <ul className="mt-8 divide-y divide-surface-border">{data.map(p => (
      <li key={p.id} className="flex items-center gap-4 py-3"><span className="text-3xl">{p.games?.emoji}</span><span className="flex-1 text-lg font-bold">{p.games?.title ?? 'Removed game'}</span><time className="text-sm text-muted-foreground">{new Date(p.played_at).toLocaleString()}</time></li>))}</ul>}
  </DashboardShell>;
}
