import { createFileRoute, Link } from "@tanstack/react-router";
import { PlanetLogo } from "@/components/planet-logo";
import { discordButtonClass, solidButtonClass } from "@/components/ghost-button";
import { DiscordIcon } from "@/components/discord-icon";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GameVerse — The community driven games universe" },
      {
        name: "description",
        content: "The #1 community driven games universe for everyone.",
      },
      { property: "og:title", content: "GameVerse — The community driven games universe" },
      {
        property: "og:description",
        content: "The #1 community driven games universe for everyone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="bg-tiles min-h-screen overflow-x-clip">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-14 px-6 pb-20 pt-8 sm:px-10 lg:min-h-[calc(100vh-88px)] lg:pb-24">
        <div>
          <h1 className="font-display flex items-center gap-[0.15em] text-[11.5vw] leading-[0.9] tracking-tight sm:text-[10vw] lg:text-[6.4vw] xl:text-[6rem]">
            <PlanetLogo className="size-[1.5em] shrink-0" />
            GameVerse
          </h1>
          <p className="mt-6 max-w-xl text-2xl font-medium leading-snug sm:text-3xl">
            The #1 community driven games universe for everyone!
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link to="/register" className={cn(solidButtonClass, "h-16 px-10 text-2xl")}>
              Register
            </Link>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noreferrer"
              className={cn(discordButtonClass, "h-16 px-10 text-2xl")}
            >
              <DiscordIcon className="size-7" />
              Discord
            </a>
          </div>
        </div>

      </section>

      <footer className="border-t border-surface-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:px-10">
          <span>© {new Date().getFullYear()} GameVerse</span>
          <Link to="/terms" className="hover:text-foreground">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
