"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeBridge() {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);

    const readVar = (name: string) => {
      try {
        return cs.getPropertyValue(name).trim() || null;
      } catch {
        return null;
      }
    };

    const colors: Record<string, string | null> = {
      theme: resolvedTheme ?? theme ?? null,
      background: readVar("--background") || readVar("--desktop-shell") || getComputedStyle(document.body).backgroundColor,
      foreground: readVar("--foreground") || getComputedStyle(document.body).color,
      desktopShell: readVar("--desktop-shell"),
      desktopPanel: readVar("--desktop-panel"),
      desktopNavActive: readVar("--desktop-nav-active"),
      desktopNavActiveForeground: readVar("--desktop-nav-active-foreground"),
    };

    // prune nulls
    Object.keys(colors).forEach((k) => {
      if (colors[k] == null) delete colors[k];
    });

    try {
      type NativeThemeBridgeWindow = {
        Android?: { onThemeChange?: (s: string) => void };
        webkit?: { messageHandlers?: { theme?: { postMessage?: (payload: unknown) => void } } };
      };

      const w = window as unknown as NativeThemeBridgeWindow;

      // Android JS interface
      if (w.Android && typeof w.Android.onThemeChange === "function") {
        w.Android.onThemeChange(JSON.stringify(colors));
        return;
      }

      // iOS message handler
      if (w.webkit?.messageHandlers?.theme) {
        w.webkit.messageHandlers.theme.postMessage?.(colors);
        return;
      }

      // generic postMessage fallback
      window.postMessage({ type: "hymnbook.theme.change", payload: colors }, "*");
    } catch {
      // ignore failures
    }
  }, [theme, resolvedTheme]);

  return null;
}
