import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { solidButtonClass } from "@/components/ghost-button";
import { cn } from "@/lib/utils";

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
  component: Login,
});

const inputClass =
  "h-12 w-full rounded-md border-2 border-input bg-card px-4 text-lg text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none";

function Login() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <main className="bg-tiles flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-4 pb-16 pt-4">
        <div className="w-full max-w-md rounded-xl border border-surface-border bg-surface p-8 shadow-2xl backdrop-blur-sm">
          <h1 className="font-display text-center text-5xl">Login</h1>
          {submitted ? (
            <p className="mt-8 text-center text-xl font-medium">
              Login isn't open yet in this preview.
            </p>
          ) : (
            <form
              className="mt-8 flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <input className={inputClass} placeholder="Username" required />
              <input className={inputClass} type="password" placeholder="Password" required />
              <button type="submit" className={cn(solidButtonClass, "mt-2 h-14 text-2xl")}>
                Login
              </button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="underline hover:text-foreground">
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
