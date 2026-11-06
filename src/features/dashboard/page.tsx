import { useRouter } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { DashboardShell } from '@/features/account/dashboard-shell';

export function PageTitle({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-bold uppercase text-muted-foreground">{kicker}</p><h1 className="mt-1 font-display text-4xl sm:text-5xl">{title}</h1></div>
      {children}
    </div>
  );
}

export function PageError({ error }: { error: unknown }) {
  const router = useRouter();
  return <DashboardShell><h1 className="text-2xl font-bold">Something went wrong</h1><p className="mt-2 text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p><button type="button" className="mt-4 rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground" onClick={() => router.invalidate()}>Try again</button></DashboardShell>;
}

export const Empty = ({ children }: { children: ReactNode }) => <div className="mt-8 rounded-xl border-2 border-dashed border-surface-border p-10 text-center text-muted-foreground">{children}</div>;

export const card = 'rounded-xl border border-surface-border bg-glass-hover p-5 shadow-tile';

export function meta(title: string, description: string) {
  const t = `${title} — GameVerse`;
  return { meta: [{ title: t }, { name: 'description', content: description }, { property: 'og:title', content: t }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] };
}
