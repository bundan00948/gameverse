import { createFileRoute } from '@tanstack/react-router';
import { BlookArt } from '@/features/dashboard/blook-art';
import { lazy, Suspense, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import tokenIcon from '@/assets/icons/gameverse-token.webp.asset.json';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { shopOptions, walletOptions } from '@/features/dashboard/data';
import { PageError, meta } from '@/features/dashboard/page';
import { Button } from '@/components/ui/button';
import { safeColor } from '@/features/dashboard/appearance';

const PackOpener = lazy(() => import('@/features/dashboard/pack-opener').then(module => ({ default: module.PackOpener })));

export const Route = createFileRoute('/_authenticated/shop')({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(shopOptions()), context.queryClient.ensureQueryData(walletOptions())]),
  head: () => meta('Market', 'Spend tokens on packs and unlock blooks.'),
  component: Shop, errorComponent: PageError, notFoundComponent: () => <p>Not found.</p>,
});

function Shop() {
  const { data: packs } = useSuspenseQuery(shopOptions()); const { data: wallet } = useSuspenseQuery(walletOptions()); const [chosen, setChosen] = useState<string | null>(null);
  const pack = packs.find(p => p.id === chosen);
  return <DashboardShell bare><div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-display text-3xl drop-shadow-[0_3px_0_rgb(0_0_0/0.3)] sm:text-4xl">Market</h1>
          </div>
    <div className="market-grid mt-5">{packs.map(p => (
      <Button key={p.id} variant="ghost" aria-label={`View ${p.name}, costs ${p.price} tokens`} onClick={() => setChosen(p.id)}
        className="market-pack group" style={{ '--pack-start': safeColor(p.gradient_start, 'var(--market-start)'), '--pack-end': safeColor(p.gradient_end, 'var(--market-end)') } as React.CSSProperties}>
        <span className="market-pack-art">
          {p.pattern_image_url && <img src={p.pattern_image_url} alt="" className="market-pack-pattern" />}
          <BlookArt src={p.image_url} alt={p.name} className="market-pack-picture" />
          {!p.image_url && <span className="market-pack-name">{p.name}</span>}
        </span>
        <span className="market-pack-price"><img src={tokenIcon.url} alt="" className="size-[30px] object-contain" />{p.price}</span>
      </Button>))}</div></div>
    {pack && <Suspense fallback={null}><PackOpener pack={pack} tokens={wallet.tokens} onClose={() => setChosen(null)} /></Suspense>}
  </DashboardShell>;
}
