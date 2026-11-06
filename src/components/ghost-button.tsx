import { cn } from "@/lib/utils";

export const ghostButtonClass = cn(
  "inline-flex items-center justify-center rounded-md border-2 border-border bg-glass",
  "font-sans font-medium text-foreground backdrop-blur-sm transition-all duration-200",
  "hover:bg-glass-hover hover:-translate-y-0.5 active:translate-y-0",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);
