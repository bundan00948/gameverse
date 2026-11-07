import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { usePlayer } from './session';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';

const inputClass =
  'h-12 w-full rounded-md border-2 border-input bg-card px-4 text-lg text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none';

export function AuthForm({ register = false }: { register?: boolean }) {
  const navigate = useNavigate();
  const user = usePlayer();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { if (user) void navigate({ to: '/dashboard', replace: true }); }, [user, navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email')); const password = String(form.get('password'));
    if (register && password !== form.get('confirm')) { setMessage('Passwords do not match.'); setBusy(false); return; }
    try {
      const { data, error } = register
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { username: String(form.get('username')) } } })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) await navigate({ to: '/dashboard', replace: true });
      else setMessage('Check your email to confirm your account before logging in.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to sign in.'); } finally { setBusy(false); }
  }

  return (
    <main className="bg-tiles flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-4 pb-16 pt-4">
        <div className="w-full max-w-md rounded-md border border-surface-border bg-surface p-8 shadow-layer">
          {register
            ? <h1 className="font-display text-center text-5xl">Register</h1>
            : <h1 className="font-display text-center text-5xl">Login</h1>}
          <form className="mt-8 flex flex-col gap-4" onSubmit={submit}>
            {register && <label className="space-y-2 text-sm font-bold">Username<input className={inputClass} name="username" placeholder="Username" autoComplete="username" aria-label="Username" required /></label>}
            <label className="space-y-2 text-sm font-bold">Email<input className={inputClass} name="email" type="email" placeholder="Email" autoComplete="email" aria-label="Email" required /></label>
            <label className="space-y-2 text-sm font-bold">Password<input className={inputClass} name="password" type="password" placeholder="Password" autoComplete={register ? 'new-password' : 'current-password'} aria-label="Password" required /></label>
            {register && <label className="space-y-2 text-sm font-bold">Confirm password<input className={inputClass} name="confirm" type="password" placeholder="Confirm password" autoComplete="new-password" aria-label="Confirm password" required /></label>}
            {register && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" required className="size-4 accent-primary" />
                I agree to the <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link>
              </label>
            )}
            {!register && <Link to="/forgot-password" className="text-sm text-muted-foreground underline hover:text-foreground">Forgot password?</Link>}
            {message && <p role="alert" className="text-center text-sm">{message}</p>}
            <Button type="submit" disabled={busy} className="mt-2 h-14 text-xl">
              {busy ? 'Please wait…' : register ? 'Register' : 'Login'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {register ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link to={register ? '/login' : '/register'} className="underline hover:text-foreground">{register ? 'Login' : 'Register'}</Link>
          </p>
          <Link to="/" className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground">← Back home</Link>
        </div>
      </div>
    </main>
  );
}
