import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { inventoryOptions, rarityClass } from '@/features/dashboard/data';
import { Empty, PageError, PageTitle, card, meta } from '@/features/dashboard/page';

export const Route = createFileRoute('/_authenticated/inventory')({
  loader: ({ context }) => context.queryClient.ensureQueryData(inventoryOptions()),
  head: () => meta('Inventory', 'Your collection of GameVerse blooks.'),
  component: Inventory, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

function Inventory() {
  const { data } = useSuspenseQuery(inventoryOptions());
  return <DashboardShell>
    <PageTitle kicker="Your collection" title="Inventory" />
    {data.length === 0 ? <Empty>No blooks yet. <Link to="/shop" preload={false} className="font-bold text-primary underline">Open a pack in the Shop</Link>.</Empty> :
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{data.map(i => i.blooks && (
      <div key={i.blooks.id} className={`${card} relative text-center`}>
        {i.quantity > 1 && <span className="absolute right-2 top-2 rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">×{i.quantity}</span>}
        <div className="text-4xl">{i.blooks.emoji}</div><p className="mt-1 text-sm font-bold">{i.blooks.name}</p>
        <p className={`text-xs font-bold uppercase ${rarityClass[i.blooks.rarity] ?? ''}`}>{i.blooks.rarity}</p>
        <p className="text-xs text-muted-foreground">{i.blooks.packs?.name}</p>
      </div>))}</div>}
  </DashboardShell>;
}
