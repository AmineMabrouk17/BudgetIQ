"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function storedTheme(): Theme | null {
  const match = document.cookie.match(/(?:^|;\s*)theme=(light|dark)/);
  return match ? (match[1] as Theme) : null;
}

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function effectiveTheme(): Theme {
  return storedTheme() ?? (systemPrefersDark() ? "dark" : "light");
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): Theme {
  return effectiveTheme();
}

function getServerSnapshot(): Theme {
  return "light";
}

function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`;
  listeners.forEach((listener) => listener());
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="btn btn-ghost btn-circle"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {isDark ? <Sun /> : <Moon />}
    </button>
  );
}
