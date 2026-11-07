import { useRouter } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { DashboardShell } from '@/features/account/dashboard-shell';
import { Button } from '@/components/ui/button';

export function PageTitle({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="gv-page-title flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase text-muted-foreground">{kicker}</p><h1 className="mt-0.5 font-display text-3xl sm:text-4xl">{title}</h1></div>
      {children}
    </div>
  );
}

export function PageError({ error }: { error: unknown }) {
  const router = useRouter();
  return <DashboardShell><h1 className="text-2xl font-bold">Something went wrong</h1><p className="mt-2 text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p><Button className="mt-4" onClick={() => router.invalidate()}>Try again</Button></DashboardShell>;
}

export const Empty = ({ children }: { children: ReactNode }) => <div className="mt-5 rounded-xl border-2 border-dashed border-surface-border p-6 text-center text-muted-foreground">{children}</div>;

export const card = 'rounded-md border border-surface-border bg-surface p-5 shadow-tile';

export function meta(title: string, description: string) {
  const t = `${title} — GameVerse`;
  return { meta: [{ title: t }, { name: 'description', content: description }, { property: 'og:title', content: t }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] };
}
