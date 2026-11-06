import { createFileRoute, Link } from "@tanstack/react-router";
import { Dices, Gamepad2, Puzzle, Rocket, Swords, Trophy, type LucideIcon } from "lucide-react";
import planetLogo from "@/assets/planet-logo.svg";
import { ghostButtonClass, solidButtonClass } from "@/components/ghost-button";
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

type Tile = { icon: LucideIcon; label: string; tone: string; delay: string };

const tiles: Tile[] = [
  { icon: Gamepad2, label: "Arcade", tone: "bg-tile-a", delay: "0s" },
  { icon: Trophy, label: "Ranked", tone: "bg-tile-c", delay: "0.6s" },
  { icon: Swords, label: "Battle", tone: "bg-tile-b", delay: "1.2s" },
  { icon: Puzzle, label: "Puzzle", tone: "bg-tile-d", delay: "0.3s" },
  { icon: Rocket, label: "Space", tone: "bg-tile-b", delay: "0.9s" },
  { icon: Dices, label: "Party", tone: "bg-tile-a", delay: "1.5s" },
];

function Index() {
  return (
    <div className="bg-tiles min-h-screen overflow-x-clip">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-14 px-6 pb-20 pt-8 sm:px-10 lg:min-h-[calc(100vh-88px)] lg:grid-cols-[1.15fr_1fr] lg:pb-24">
        <div>
          <h1 className="font-display flex items-center gap-[0.15em] text-[11.5vw] leading-[0.9] tracking-tight sm:text-[10vw] lg:text-[6.4vw] xl:text-[6rem]">
            <img src={planetLogo} alt="" width={128} height={128} className="size-[0.9em] shrink-0" />
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
              className={cn(ghostButtonClass, "h-16 px-10 text-2xl")}
            >
              Discord
            </a>
          </div>
        </div>

        {/* Game tile cluster */}
        <div className="relative mx-auto w-full max-w-[18rem] px-2 sm:max-w-md lg:max-w-none" aria-hidden="true">
          <div className="grid -rotate-6 grid-cols-3 gap-4 sm:gap-5">
            {tiles.map(({ icon: Icon, label, tone, delay }, i) => (
              <div
                key={label}
                className={cn(
                  "animate-float flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl text-tile-fg shadow-tile",
                  tone,
                  i % 2 === 1 && "translate-y-8",
                )}
                style={{ animationDelay: delay }}
              >
                <Icon className="size-1/3" strokeWidth={2.2} />
                <span className="text-sm font-bold sm:text-base">{label}</span>
              </div>
            ))}
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
