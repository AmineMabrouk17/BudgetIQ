"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

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

export default function ThemeAwareImage({
  lightSrc,
  darkSrc,
  alt,
  width,
  height,
  priority = false,
  className,
}: {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <Image
      src={theme === "dark" ? darkSrc : lightSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
