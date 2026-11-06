import { cn } from "@/lib/utils";

export const ghostButtonClass = cn(
  "inline-flex items-center justify-center rounded-md border-2 border-border bg-glass",
  "font-sans font-medium text-foreground backdrop-blur-sm transition-all duration-200",
  "hover:bg-glass-hover hover:-translate-y-0.5 active:translate-y-0",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

export const discordButtonClass = cn(
  "inline-flex items-center justify-center gap-3 rounded-md border-2 border-discord bg-discord",
  "font-sans font-bold text-discord-foreground transition-all duration-200",
  "hover:-translate-y-0.5 hover:bg-discord-hover hover:border-discord-hover active:translate-y-0",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

export const solidButtonClass = cn(
  "inline-flex items-center justify-center rounded-md border-2 border-primary bg-primary",
  "font-sans font-bold text-primary-foreground transition-all duration-200",
  "hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);
