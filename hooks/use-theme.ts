"use client";

import { useEffect, useState } from "react";
import {
  THEME_DEV_STORAGE_KEY,
  THEME_USER_STORAGE_KEY,
  getResolvedTheme,
  applyThemeToDocument,
  THEME_REFRESH_EVENT,
  isDevThemeChrome,
  setUserThemePreference,
} from "@/lib/app-theme";

export type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const sync = () => {
      const t = getResolvedTheme();
      setTheme(t);
      applyThemeToDocument(t);
    };

    sync();

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onSchemeChange = () => {
      if (isDevThemeChrome()) {
        const o = localStorage.getItem(THEME_DEV_STORAGE_KEY);
        if (o === "light" || o === "dark") return;
      }
      const user = localStorage.getItem(THEME_USER_STORAGE_KEY);
      if (user === "light" || user === "dark") return;
      sync();
    };
    mql.addEventListener("change", onSchemeChange);

    const onRefresh = () => sync();
    window.addEventListener(THEME_REFRESH_EVENT, onRefresh);
    window.addEventListener("storage", onRefresh);

    return () => {
      mql.removeEventListener("change", onSchemeChange);
      window.removeEventListener(THEME_REFRESH_EVENT, onRefresh);
      window.removeEventListener("storage", onRefresh);
    };
  }, []);

  const toggleTheme = () => {
    const next = getResolvedTheme() === "dark" ? "light" : "dark";
    setUserThemePreference(next);
    setTheme(next);
  };

  return { theme, toggleTheme };
}
