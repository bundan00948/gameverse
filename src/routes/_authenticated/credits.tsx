import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery, useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { PageTitle } from '@/features/dashboard/page';
import { identitiesOptions } from '@/features/dashboard/roles';
import { creditsOptions, CreditPlate } from '@/features/credits/credits';

const t = 'Credits — GameVerse', d = 'The players who helped build GameVerse.';
export const Route = createFileRoute('/_authenticated/credits')({
  loader: ({ context }) => context.queryClient.ensureQueryData(creditsOptions()),
  head: () => ({ meta: [{ title: t }, { name: 'description', content: d }, { property: 'og:title', content: t }, { property: 'og:description', content: d }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Credits,
});

function Credits() {
  const { data: rows } = useSuspenseQuery(creditsOptions());
  const { data: ids } = useQuery(identitiesOptions());
  const [a, b, ...rest] = rows;
  return <DashboardShell>
    <PageTitle kicker="Thank you" title="Credits" />
    {!rows.length && <p className="mt-6 text-muted-foreground">No credits yet.</p>}
    {a && <div className="mt-6 grid gap-4 md:grid-cols-[1fr_0.75fr]">
      <CreditPlate size="big" identity={ids?.get(a.user_id)} description={a.description} />
      {b && <CreditPlate size="medium" identity={ids?.get(b.user_id)} description={b.description} />}
    </div>}
    {rest.length > 0 && <div className="mt-4 grid gap-4 sm:grid-cols-2">{rest.map(r => <CreditPlate key={r.id} size="small" identity={ids?.get(r.user_id)} description={r.description} />)}</div>}
  </DashboardShell>;
}
