import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ghostButtonClass } from "@/components/ghost-button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — Blacket" },
      { name: "description", content: "Create your Blacket account and start trading." },
      { property: "og:title", content: "Register — Blacket" },
      { property: "og:description", content: "Create your Blacket account and start trading." },
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
    <main className="bg-tiles flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-xl bg-card/95 p-8 shadow-2xl">
        <Link to="/" className="font-display block text-center text-6xl">
          BLACKET
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
        <Link to="/" className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground">
          ← Back home
        </Link>
      </div>
    </main>
  );
}
