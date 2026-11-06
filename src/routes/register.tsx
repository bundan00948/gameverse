import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { useState } from "react";
import { ghostButtonClass } from "@/components/ghost-button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — GameVerse" },
      { name: "description", content: "Create your GameVerse account and start playing." },
      { property: "og:title", content: "Register — GameVerse" },
      { property: "og:description", content: "Create your GameVerse account and start playing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Register,
});

const inputClass =
  "h-12 w-full rounded-md border-2 border-input bg-card px-4 text-lg text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none";

function Register() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="bg-tiles flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-4 pb-16 pt-4">
      <div className="w-full max-w-md rounded-xl border border-surface-border bg-surface backdrop-blur-sm p-8 shadow-2xl">
        <Link to="/" className="font-display block text-center text-6xl">
          GameVerse
        </Link>
        {submitted ? (
          <p className="mt-8 text-center text-xl font-medium">
            Thanks! Registration isn't open yet in this preview.
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
            <input className={inputClass} type="password" placeholder="Confirm password" required />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" required className="size-4 accent-primary" />
              I agree to the{" "}
              <Link to="/terms" className="underline hover:text-foreground">
                Terms of Service
              </Link>
            </label>
            <button type="submit" className={cn(ghostButtonClass, "mt-2 h-14 text-2xl")}>
              Register
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="underline hover:text-foreground">
            Login
          </Link>
        </p>
        <Link to="/" className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground">
          ← Back home
        </Link>
      </div>
      </div>
    </main>
  );
}
