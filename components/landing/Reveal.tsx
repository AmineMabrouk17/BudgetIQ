"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

type RevealVariant = "up" | "fade" | "left" | "right" | "scale";

const HIDDEN_CLASSES: Record<RevealVariant, string> = {
  up: "opacity-0 translate-y-8",
  fade: "opacity-0",
  left: "opacity-0 -translate-x-8",
  right: "opacity-0 translate-x-8",
  scale: "opacity-0 scale-95",
};

const VISIBLE_CLASSES: Record<RevealVariant, string> = {
  up: "opacity-100 translate-y-0",
  fade: "opacity-100",
  left: "opacity-100 translate-x-0",
  right: "opacity-100 translate-x-0",
  scale: "opacity-100 scale-100",
};

interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
}

export default function Reveal({
  children,
  variant = "up",
  delay = 0,
  className,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduced = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (reduced || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [reduced]);

  const isVisible = reduced || visible;

  return (
    <div
      ref={ref}
      style={delay && !reduced ? { transitionDelay: `${delay}ms` } : undefined}
      className={`${
        isVisible ? VISIBLE_CLASSES[variant] : HIDDEN_CLASSES[variant]
      } ${reduced ? "" : "transition-[opacity,transform] duration-700 ease-out"} ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}
