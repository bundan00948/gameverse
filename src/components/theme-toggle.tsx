import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { ghostButtonClass } from "@/components/ghost-button";
import { cn } from "@/lib/utils";

export const THEME_STORAGE_KEY = "gameverse-theme";

/** Runs before paint so the saved theme applies without a flash. */
export const themeInitScript = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="bright")document.documentElement.classList.add("bright")}catch(e){}`;

export function ThemeToggle({ className }: { className?: string }) {
  const [bright, setBright] = useState(false);

  useEffect(() => {
    setBright(document.documentElement.classList.contains("bright"));
  }, []);

  const toggle = () => {
    const next = !bright;
    setBright(next);
    document.documentElement.classList.toggle("bright", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? "bright" : "dark");
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={bright ? "Switch to dark colors" : "Switch to bright colors"}
      className={cn(ghostButtonClass, "h-11 gap-2 rounded-full px-4 text-base", className)}
    >
      {bright ? <Moon className="size-5" /> : <Sun className="size-5" />}
      {bright ? "Dark" : "Bright"}
    </button>
  );
}
