import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  Dices,
  Gamepad2,
  Gem,
  MessagesSquare,
  Puzzle,
  Rocket,
  Swords,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { ghostButtonClass, solidButtonClass } from "@/components/ghost-button";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GameVerse — The community driven games universe" },
      {
        name: "description",
        content:
          "Play games, collect and trade, finish daily missions and hang out with friends — all in one universe.",
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

const features: { icon: LucideIcon; title: string; body: string; tone: string }[] = [
  {
    icon: Gamepad2,
    title: "Play anything",
    body: "Jump into a growing library of browser games. No downloads, no waiting.",
    tone: "bg-tile-a",
  },
  {
    icon: Gem,
    title: "Collect & trade",
    body: "Open packs, unlock rare collectibles and trade with the community.",
    tone: "bg-tile-b",
  },
  {
    icon: CalendarCheck,
    title: "Daily missions",
    body: "Claim a free daily reward and complete missions to earn stars.",
    tone: "bg-tile-c",
  },
  {
    icon: MessagesSquare,
    title: "Friends & chat",
    body: "Add friends, compare profiles and chat while you play.",
    tone: "bg-tile-d",
  },
];

function Index() {
  return (
    <div className="bg-tiles min-h-screen overflow-x-clip">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-8 sm:px-10 lg:min-h-[calc(100vh-88px)] lg:grid-cols-[1.15fr_1fr] lg:pb-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface px-4 py-1.5 text-sm font-semibold text-muted-foreground backdrop-blur-sm">
            <span className="size-2 rounded-full bg-tile-a" />
            Free to play · In your browser
          </span>
          <h1 className="font-display mt-6 text-[15vw] leading-[0.9] tracking-tight sm:text-[12vw] lg:text-[7.2vw] xl:text-[6.5rem]">
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

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-6 px-6 pb-24 sm:px-10">
        <h2 className="font-display text-4xl sm:text-5xl">Everything in one universe</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body, tone }) => (
            <article
              key={title}
              className="rounded-2xl border border-surface-border bg-surface p-6 backdrop-blur-sm transition-transform duration-200 hover:-translate-y-1"
            >
              <div className={cn("flex size-12 items-center justify-center rounded-xl text-tile-fg", tone)}>
                <Icon className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold">{title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-3xl border border-surface-border bg-surface p-8 backdrop-blur-sm sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl">Ready to play?</h2>
            <p className="mt-2 text-lg text-muted-foreground">Create your free account in seconds.</p>
          </div>
          <Link to="/register" className={cn(solidButtonClass, "h-14 px-8 text-xl")}>
            Get started
          </Link>
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
