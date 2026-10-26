"use client";

import { Button } from "@/components/ui/button";
import {
  applyTheme,
  getDocumentTheme,
  type ThemeMode,
} from "@/lib/theme/apply-theme";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setTheme(getDocumentTheme());
      setMounted(true);
    });
  }, []);

  function toggle() {
    const next: ThemeMode = theme === "light" ? "dark" : "light";
    applyTheme(next);
    setTheme(next);
  }

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        className={`px-2 py-2 ${className}`}
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-5 w-5 opacity-40" aria-hidden />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      className={`px-2 py-2 ${className}`}
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Mode clair" : "Mode sombre"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-text-700" aria-hidden />
      ) : (
        <Moon className="h-5 w-5 text-text-600" aria-hidden />
      )}
    </Button>
  );
}
