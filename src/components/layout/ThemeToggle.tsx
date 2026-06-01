"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, startTransition } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // startTransition defers setState out of synchronous effect body,
    // satisfying the react-hooks/set-state-in-effect rule while still
    // acting as the required Next.js SSR hydration guard for themes.
    startTransition(() => setMounted(true));
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/50 flex-shrink-0" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-9 h-9 rounded-xl flex items-center justify-center border border-outline-variant bg-surface hover:bg-surface-container transition-all"
      aria-label="Toggle theme"
      title={isDark ? "Mode Terang (Soft Light)" : "Mode Gelap (Comfort Dark)"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-primary" />
      ) : (
        <Moon className="w-4 h-4 text-primary" />
      )}
    </button>
  );
}
