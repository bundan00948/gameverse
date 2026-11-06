import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";
import { solidButtonClass } from "@/components/ghost-button";
import { cn } from "@/lib/utils";
import { PlanetLogo } from "@/components/planet-logo";

export function SiteHeader() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-5 sm:px-10">
      <Link to="/" className="font-display flex items-center gap-2 text-3xl tracking-tight">
        <PlanetLogo className="size-12" />
        GameVerse
      </Link>
      <nav className="flex items-center gap-2 sm:gap-6">
        <Link
          to="/terms"
          className="hidden text-base font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block"
        >
          Rules
        </Link>
        <ThemeToggle />
        <Link to="/register" className={cn(solidButtonClass, "hidden h-11 px-5 text-base sm:inline-flex")}>
          Register
        </Link>
      </nav>
    </header>
  );
}
