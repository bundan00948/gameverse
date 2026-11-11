import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/features/account/auth-form";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { redeemAuthLink } from "@/lib/auth-links.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — GameVerse" },
      { name: "description", content: "Log in to your GameVerse account." },
      { property: "og:title", content: "Login — GameVerse" },
      { property: "og:description", content: "Log in to your GameVerse account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { key?: string } => (typeof s["key"] === "string" ? { key: s["key"] } : {}),
  component: Page,
});

function Page() {
  const { key } = Route.useSearch();
  const redeem = useServerFn(redeemAuthLink);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!key) return;
    void (async () => {
      try {
        const r = await redeem({ data: { key } });
        if (!r.tokenHash) { setError(r.error); return; }
        const { error: e } = await supabase.auth.verifyOtp({ token_hash: r.tokenHash, type: "magiclink" });
        if (e) { setError(e.message); return; }
        window.location.replace("/dashboard");
      } catch { setError("This login link is invalid, used or expired."); }
    })();
  }, [key, redeem]);
  if (key && !error) return <p role="status" className="grid min-h-dvh place-items-center font-display text-2xl">Signing you in…</p>;
  return <>{error && <p role="alert" className="p-4 text-center text-destructive">{error}</p>}<AuthForm /></>;
}
