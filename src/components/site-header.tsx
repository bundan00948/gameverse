import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";
import { ghostButtonClass, solidButtonClass } from "@/components/ghost-button";
import { cn } from "@/lib/utils";
import { PlanetLogo } from "@/components/planet-logo";

import { usePlayer } from "@/features/account/session";

export function SiteHeader() {
  const user = usePlayer();
  return (
    <div className="relative z-20 mx-auto w-full max-w-7xl px-4 pt-4 sm:px-8 sm:pt-6">
      <header className="flex items-center justify-between gap-3 rounded-2xl border border-surface-border bg-surface/70 px-4 py-2.5 shadow-tile backdrop-blur-md sm:px-6">
        <Link
          to="/"
          className="font-display group flex items-center gap-2 text-2xl tracking-tight sm:text-3xl"
        >
          <PlanetLogo className="size-10 transition-transform duration-500 group-hover:rotate-12 sm:size-11" />
          GameVerse
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <span className="mx-1 hidden h-7 w-px bg-surface-border sm:block" />
          {user ? <Link to="/dashboard" preload={false} className={cn(solidButtonClass, "h-10 px-4 text-base")}>Dashboard</Link> : <><Link to="/login" className={cn(ghostButtonClass, "h-10 px-4 text-base")}>
            Login
          </Link>
          <Link
            to="/register"
            className={cn(solidButtonClass, "hidden h-10 px-5 text-base sm:inline-flex")}
          >
            Register
          </Link></>}
        </nav>
      </header>
    </div>
  );
}
