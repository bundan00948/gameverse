import { Moon, Sun } from '@/lib/icons';
import { useEffect, useState } from "react";
import { Button } from '@/components/ui/button';
import { applyTheme } from '@/lib/theme';
export { THEME_STORAGE_KEY, themeInitScript } from '@/lib/theme';

export function ThemeToggle({ className }: { className?: string }) {
  const [bright, setBright] = useState(false);

  useEffect(() => {
    setBright(document.documentElement.classList.contains("bright"));
  }, []);

  const toggle = () => {
    const next = !bright;
    setBright(next);
    applyTheme(next ? 'bright' : 'dark');
  };

  return (
    <Button variant="outline"
      type="button"
      onClick={toggle}
      aria-label={bright ? "Switch to dark colors" : "Switch to bright colors"}
      className={className}
    >
      {bright ? <Moon className="size-5" /> : <Sun className="size-5" />}
      {bright ? "Dark" : "Bright"}
    </Button>
  );
}
