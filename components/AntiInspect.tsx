"use client";

import { useEffect } from "react";

const DEVTOOLS_HOTKEYS = ["F12", "u", "s", "i", "j", "c"];

function isDevToolsShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();
  const modifier = event.ctrlKey || event.metaKey;

  if (event.key === "F12") return true;
  if (modifier && key === "u") return true;
  if (modifier && key === "s") return true;
  if (modifier && event.shiftKey && DEVTOOLS_HOTKEYS.includes(key)) return true;
  return false;
}

export default function AntiInspect() {
  useEffect(() => {
    function onContextMenu(event: MouseEvent) {
      event.preventDefault();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (isDevToolsShortcut(event)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function detectDevTools() {
      const threshold = 160;
      const opened =
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold;

      if (opened) {
        console.warn(
          "AntiInspect: Developer tools detected. This protection is cosmetic — it never protects the underlying code, which is always downloaded to your browser."
        );
      }
    }

    document.documentElement.classList.add("anti-inspect");
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    const detector = window.setInterval(detectDevTools, 2000);

    return () => {
      document.documentElement.classList.remove("anti-inspect");
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      window.clearInterval(detector);
    };
  }, []);

  return null;
}
