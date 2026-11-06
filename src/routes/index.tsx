import { createFileRoute, Link } from "@tanstack/react-router";
import mascot from "@/assets/mascot.png";
import { ghostButtonClass } from "@/components/ghost-button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blacket — The community driven trading web-game" },
      {
        name: "description",
        content: "The #1 community driven trading web-game for everyone. Register and join the Discord.",
      },
      { property: "og:title", content: "Blacket — The community driven trading web-game" },
      {
        property: "og:description",
        content: "The #1 community driven trading web-game for everyone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="bg-tiles relative min-h-screen overflow-hidden">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col justify-center px-6 py-16 sm:px-12 lg:px-[8vw]">
        <h1 className="font-display text-[22vw] leading-[0.9] tracking-tight text-foreground sm:text-[16vw] lg:text-[9.5vw]">
          BLACKET
        </h1>
        <p className="mt-6 max-w-[34rem] text-2xl font-medium leading-snug sm:text-3xl lg:text-[2.6rem] lg:leading-[1.3]">
          The #1 community driven
          <br />
          trading
          <br />
          web-game for everyone!
        </p>

        <div className="mt-12 flex w-full max-w-[24rem] flex-col gap-5">
          <Link to="/register" className={cn(ghostButtonClass, "h-28 text-5xl sm:text-6xl")}>
            Register
          </Link>
          <a
            href="https://discord.com"
            target="_blank"
            rel="noreferrer"
            className={cn(ghostButtonClass, "h-28 text-5xl sm:text-6xl")}
          >
            Discord
          </a>
        </div>
      </div>

      {/* Pedestal + mascot */}
      <div className="pointer-events-none absolute bottom-0 right-[8vw] hidden w-[22vw] max-w-[360px] lg:block">
        <div className="relative h-[100vh]">
          <div className="pedestal-arch absolute left-0 right-0 top-[40vh] h-[15vh] rounded-t-full" />
          <div className="absolute bottom-0 left-0 right-0 top-[60vh] bg-pedestal" />
          <img
            src={mascot}
            alt="Blacket mascot"
            width={832}
            height={1216}
            className="animate-float absolute left-1/2 top-[10vh] w-[115%] max-w-none -translate-x-1/2 drop-shadow-2xl"
          />
        </div>
      </div>

      <Link
        to="/terms"
        className="absolute bottom-3 right-4 z-10 text-xs text-muted-foreground hover:text-foreground"
      >
        Terms of Service
      </Link>
    </main>
  );
}
