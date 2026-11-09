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

// Runs inline in <head> before any module loads: a new deploy replaces hashed
// JS chunks, and a tab holding the old HTML fails its very first import (the
// entry chunk) with a blank screen — before React can mount any listener.
// Reload once so the tab picks up the fresh build instead of staying broken.
const chunkRecoveryScript = `(function(){var k=${JSON.stringify(CHUNK_RELOAD_KEY)};function stale(m){return typeof m==="string"&&(m.indexOf("Importing a module script failed")>-1||m.indexOf("Failed to fetch dynamically imported module")>-1||m.indexOf("error loading dynamically imported module")>-1)}function recover(m){if(!stale(m)||sessionStorage.getItem(k))return;sessionStorage.setItem(k,"1");window.location.reload()}window.addEventListener("error",function(e){recover(e.message||(e.error&&e.error.message))},true);window.addEventListener("unhandledrejection",function(e){var r=e.reason;recover(r&&r.message||String(r))});setTimeout(function(){sessionStorage.removeItem(k)},10000)})();`;

function isStaleChunkError(reason: unknown): boolean {
  const message = reason instanceof Error ? reason.message : String(reason ?? "");
  return (
    message.includes("Importing a module script failed") ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("error loading dynamically imported module")
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    // A new deploy replaces hashed JS chunks; an open tab holding the old
    // bundle fails its next lazy import with a blank screen. Reload once so
    // the tab picks up the fresh build instead of staying broken.
    const recover = (reason: unknown) => {
      if (!isStaleChunkError(reason)) return;
      if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;
      sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
      window.location.reload();
    };
    const onRejection = (event: PromiseRejectionEvent) => recover(event.reason);
    const onError = (event: ErrorEvent) => recover(event.error ?? event.message);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    // The page loaded fine, so allow a future deploy to trigger one reload again.
    const clearFlag = window.setTimeout(() => sessionStorage.removeItem(CHUNK_RELOAD_KEY), 10_000);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
      window.clearTimeout(clearFlag);
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
