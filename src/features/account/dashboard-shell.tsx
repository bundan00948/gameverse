import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Gamepad2, BarChart3, History, Store, Backpack, Target, MessageCircle, Settings, Star, LogOut, ShieldCheck, Gavel } from '@/lib/icons';
import { Mailbox } from '@/features/mail/mailbox';
import { supabase } from '@/integrations/supabase/client';
import { PlanetLogo } from '@/components/planet-logo';
import { Button } from '@/components/ui/button';
import { usePlayer } from './session';
import { walletOptions } from '@/features/dashboard/data';
import { notificationsOptions, permissionsOptions } from '@/features/dashboard/roles';
import { cn } from '@/lib/utils';
import tokensIcon from '@/assets/icons/gameverse-token.webp.asset.json';
import { identitiesOptions } from '@/features/dashboard/roles';
import { PlayerAvatar, PlayerName } from '@/features/dashboard/player-identity';
import { playerName } from '@/features/dashboard/player-profile';

const nav = [
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/dashboard', label: 'Games', icon: Gamepad2 },
  { to: '/history', label: 'History', icon: History },
  { to: '/shop', label: 'Market', icon: Store },
  { to: '/bazaar', label: 'Bazaar', icon: Gavel },
  { to: '/inventory', label: 'Inventory', icon: Backpack },
  { to: '/missions', label: 'Missions', icon: Target },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

const navClass =
  'gv-nav-link group flex min-h-11 items-center gap-3 rounded-md px-3 py-2 font-nav text-[1.1rem] font-bold tracking-wide text-white transition-colors hover:bg-glass-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const activeClass = 'gv-nav-active';

export function DashboardShell({ children, bare = false, market = false }: { children: ReactNode; bare?: boolean; market?: boolean }) {
  const cache = useQueryClient(); const navigate = useNavigate(); const user = usePlayer(); const { data: perms = [] } = useQuery(permissionsOptions()); const isAdmin = perms.length > 0; const { data: notes = [] } = useQuery(notificationsOptions()); const unread = notes.filter(n => !n.read).length; const { data: wallet } = useQuery(walletOptions()); const { data: ids } = useQuery(identitiesOptions()); const me = user ? ids?.get(user.id) : undefined;
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function logout() {
    setBusy(true); await cache.cancelQueries(); cache.clear();
    const { error } = await supabase.auth.signOut();
    if (error) { setError(error.message); setBusy(false); return; }
    await navigate({ to: '/login', replace: true });
  }
  const name = playerName(me);
  return (
    <div className={cn(market ? 'market-background' : 'bg-tiles', 'gv-shell relative min-h-dvh md:pl-56')}>
      <a href="#page-content" className="gv-skip-link">Skip to content</a>
      <aside aria-label="GameVerse sidebar" className="gv-sidebar z-20 flex flex-col border-b border-surface-border bg-surface md:fixed md:inset-y-0 md:left-0 md:w-56 md:border-b-0 md:border-r">
        <Link to="/" className="flex min-h-20 items-center gap-2 px-4 py-4 font-display text-2xl">
          <PlanetLogo className="size-8" />GameVerse
        </Link>
        <nav aria-label="Main navigation" className="gv-navigation flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} preload={false} className={navClass} activeProps={{ className: activeClass }}>
              <Icon aria-hidden="true" className="size-5 shrink-0" />{label}{to === '/chat' && unread > 0 && <span aria-label={`${unread} new replies`} className="ml-auto rounded-full bg-destructive px-1.5 text-xs text-destructive-foreground">{unread}</span>}
            </Link>
          ))}
          {isAdmin && <Link to="/admin" preload={false} className={cn(navClass, 'text-tile-d')} activeProps={{ className: activeClass }}><ShieldCheck className="size-5 shrink-0" />Admin Panel</Link>}
        </nav>
        <div className="hidden items-center gap-2 border-t border-surface-border p-3 md:flex">
          <PlayerAvatar name={name} identity={me} className="size-6" />
          <p className="min-w-0 flex-1 truncate text-sm font-bold"><PlayerName name={name} identity={me} /></p>
          <Mailbox />
          <Link to="/credits" preload={false} aria-label="Credits" className="grid size-11 shrink-0 place-items-center rounded-md hover:bg-glass-hover"><Star className="size-5" /></Link>
          <Link to="/settings" preload={false} aria-label="Account settings" className="grid size-11 shrink-0 place-items-center rounded-md hover:bg-glass-hover"><Settings className="size-5" /></Link>
        </div>
        <Button variant="ghost" type="button" disabled={busy} onClick={logout} className={cn(navClass, 'mx-3 mb-3 justify-start hover:text-destructive disabled:opacity-60')}>
          <LogOut className="size-5" />{busy ? 'Signing out…' : 'Sign out'}
        </Button>
        {error && <p role="alert" className="px-3 pb-2 text-xs text-destructive">{error}</p>}
      </aside>
      <header className="gv-topbar pointer-events-none absolute right-2 top-2 z-10 flex justify-end sm:right-8 sm:top-4">
        <div className="pointer-events-auto flex min-w-0 items-stretch gap-1.5 sm:gap-2">
          <span aria-label={`${wallet?.tokens ?? 0} tokens`} className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-black/70 px-2 py-1 font-display text-sm shadow-[0_4px_0_rgb(0_0_0/0.3)] sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-lg"><img src={tokensIcon.url} alt="" className="size-4 object-contain sm:size-6" />{wallet?.tokens ?? '–'}</span>
          <Link to="/stats" preload={false} className="flex min-h-8 min-w-0 items-center gap-1.5 rounded-lg border border-white/10 bg-black/70 px-2 py-1 text-xs font-bold shadow-[0_4px_0_rgb(0_0_0/0.3)] transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-10 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-sm"><PlayerAvatar name={name} identity={me} className="size-4 rounded text-xs sm:size-5 sm:text-sm" /><PlayerName name={name} identity={me} className="max-w-20 truncate sm:max-w-32" /></Link>
        </div>
      </header>
      <main id="page-content" tabIndex={-1} className={cn('gv-content mx-auto w-full max-w-7xl p-4 pt-20 sm:p-8 sm:pt-20', !bare && 'gv-standard-page')}>{children}</main>
    </div>
  );
}
