import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { usePlayer } from './session';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import '@lovable.dev/cloud-auth-js/styles.css';
export function AuthForm({ register = false }: { register?: boolean }) {
  const navigate = useNavigate(); const user = usePlayer();
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  useEffect(() => { if (user) void navigate({ to: '/dashboard', replace: true }); }, [user, navigate]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget); const email = String(form.get('email')); const password = String(form.get('password'));
    if (register && password !== form.get('confirm')) { setMessage('Passwords do not match.'); setBusy(false); return; }
    try {
      const { data, error } = register ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { username: String(form.get('username')) } } }) : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) await navigate({ to: '/dashboard', replace: true }); else setMessage('Check your email to confirm your account before logging in.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to sign in.'); } finally { setBusy(false); }
  }
  async function social(provider: 'google' | 'lovable') {
    setBusy(true); setMessage('');
    try { const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + '/login' }); if (result.error) throw result.error; if (!result.redirected) await navigate({ to: '/dashboard', replace: true }); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to sign in.'); } finally { setBusy(false); }
  }
  return <main className="bg-tiles min-h-screen"><SiteHeader /><section className="mx-auto max-w-md px-5 py-10 sm:py-16"><h1 className="font-display text-4xl">{register ? 'Create account' : 'Welcome back'}</h1><form className="mt-8 space-y-4" onSubmit={submit}>
    {register && <Field name="username" label="Username" autoComplete="username" />}
    <Field name="email" label="Email" type="email" autoComplete="email" />
    <Field name="password" label="Password" type="password" autoComplete={register ? 'new-password' : 'current-password'} />
    {register && <><Field name="confirm" label="Confirm password" type="password" autoComplete="new-password" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" required />I agree to the <Link to="/terms" className="underline">Terms of Service</Link></label></>}
    {!register && <Link to="/forgot-password" className="block text-sm underline">Forgot password?</Link>}
    {message && <p role="status" className="text-sm">{message}</p>}
    <Button disabled={busy} type="submit" className="h-12 w-full text-lg">{busy ? 'Please wait…' : register ? 'Register' : 'Login'}</Button>
  </form><div className="my-6 flex items-center gap-3 text-muted-foreground"><span className="h-px flex-1 bg-surface-border" />or<span className="h-px flex-1 bg-surface-border" /></div>
  <div className="space-y-3"><Button variant="outline" className="google-auth h-12 w-full" disabled={busy} onClick={() => social('google')}><svg aria-hidden="true" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Continue with Google</Button><Button className="lovable-auth-button h-12 w-full" disabled={busy} onClick={() => social('lovable')}>Continue with Lovable</Button></div>
  <p className="mt-6 text-sm">{register ? 'Already have an account?' : 'New to GameVerse?'} <Link to={register ? '/login' : '/register'} className="underline">{register ? 'Login' : 'Register'}</Link></p></section></main>;
}
function Field({ label, ...props }: { label: string; name: string; type?: string; autoComplete?: string }) { return <label className="block text-sm font-semibold">{label}<input {...props} required className="mt-2 h-12 w-full rounded-md border border-input bg-card px-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring" /></label>; }
