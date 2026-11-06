import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Gamepad2, UserRound, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
export function DashboardShell({ children }: { children: ReactNode }) {
  const cache = useQueryClient(); const navigate = useNavigate(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function logout() { setBusy(true); await cache.cancelQueries(); cache.clear(); const { error } = await supabase.auth.signOut(); if (error) { setError(error.message); setBusy(false); return; } await navigate({ to: '/login', replace: true }); }
  return <main className="bg-tiles min-h-screen"><SiteHeader /><div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 md:grid-cols-[200px_minmax(0,1fr)]"><aside className="flex flex-wrap gap-2 md:flex-col"><Button asChild variant="ghost" className="justify-start"><Link to="/dashboard" preload={false} activeProps={{ className: 'bg-primary text-primary-foreground' }}><Gamepad2 />Games</Link></Button><Button asChild variant="ghost" className="justify-start"><Link to="/profile" preload={false} activeProps={{ className: 'bg-primary text-primary-foreground' }}><UserRound />Profile</Link></Button><Button variant="ghost" disabled={busy} onClick={logout} className="justify-start md:mt-8"><LogOut />{busy ? 'Signing out…' : 'Sign out'}</Button>{error && <p role="alert">{error}</p>}</aside><div className="min-w-0">{children}</div></div></main>;
}
