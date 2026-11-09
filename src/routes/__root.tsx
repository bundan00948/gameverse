import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { SessionProvider } from "@/features/account/session";
import titanFont from "@/assets/fonts/titan-one-latin.woff2?url";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { themeInitScript } from "../components/theme-toggle";

function NotFoundComponent() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GameVerse" },
      { name: "description", content: "The community driven games universe for everyone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preload", as: "font", type: "font/woff2", href: titanFont, crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: chunkRecoveryScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const CHUNK_RELOAD_KEY = "gameverse-chunk-reload";

declare global {
  interface Window {
    __gvChunkRecover?: (message: string) => void;
  }
}

// Runs inline in <head> before any module loads: a new deploy (or a dev server
// reload) replaces hashed JS chunks, and a tab holding the old HTML fails its
// very first import with a blank screen — before React can mount any listener.
// Retry the reload a bounded number of times so one failed recovery attempt
// cannot leave the tab stuck blank.
const chunkRecoveryScript = `(function(){var k=${JSON.stringify(CHUNK_RELOAD_KEY)};var MAX=4;function read(){try{return JSON.parse(sessionStorage.getItem(k))||{n:0,t:0}}catch(e){return{n:0,t:0}}}function write(s){try{sessionStorage.setItem(k,JSON.stringify(s))}catch(e){}}function stale(m){return typeof m==="string"&&(m.indexOf("Importing a module script failed")>-1||m.indexOf("Failed to fetch dynamically imported module")>-1||m.indexOf("error loading dynamically imported module")>-1)}function mounted(){return document.documentElement.hasAttribute("data-app-mounted")}function retry(m){if(!stale(m))return;var s=read();if(s.n>=MAX||Date.now()-s.t<1200)return;s.n+=1;s.t=Date.now();write(s);window.location.reload()}window.__gvChunkRecover=retry;window.addEventListener("error",function(e){retry(e.message||(e.error&&e.error.message))},true);window.addEventListener("unhandledrejection",function(e){var r=e.reason;retry(r&&r.message||String(r))});[2500,5000,9000].forEach(function(d){setTimeout(function(){var s=read();if(!s.n||s.n>=MAX||mounted()||Date.now()-s.t<1200)return;retry("Failed to fetch dynamically imported module watchdog")},d)})})();`;

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    // A new deploy replaces hashed JS chunks; an open tab holding the old
    // bundle fails its next lazy import with a blank screen. The inline head
    // script owns the bounded reloads, so this only forwards post-mount
    // failures to it and marks the app alive so the watchdog stops retrying.
    document.documentElement.setAttribute("data-app-mounted", "");
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    const recover = (reason: unknown) => {
      window.__gvChunkRecover?.(reason instanceof Error ? reason.message : String(reason ?? ""));
    };
    const onRejection = (event: PromiseRejectionEvent) => recover(event.reason);
    const onError = (event: ErrorEvent) => recover(event.error ?? event.message);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);
  useEffect(() => {
    let active = true;
    // Display identity uses the local session; the signed-in gate still verifies getUser().
    const refresh = () => { void supabase.auth.getSession().then(({ data }) => { if (active) setUser(data.session?.user ?? null); }); };
    refresh();
    const profileChanged = (event: StorageEvent) => { if (event.key === 'gameverse-profile-updated') void queryClient.invalidateQueries({ queryKey: ['identities'] }); };
    window.addEventListener('storage', profileChanged);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT' && event !== 'USER_UPDATED') return;
      if (event === 'SIGNED_OUT') setUser(null); else refresh();
      void router.invalidate();
      if (event !== 'SIGNED_OUT') void queryClient.invalidateQueries();
    });
    return () => { active = false; subscription.unsubscribe(); window.removeEventListener('storage', profileChanged); };
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <SessionProvider user={user}><Outlet /></SessionProvider>
    </QueryClientProvider>
  );
}
