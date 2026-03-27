/**
 * Resolved theme order:
 * 1. Dev panel override (`taya-theme-dev`) when dev chrome is on
 * 2. User menu preference (`taya-theme`) — light | dark, any environment
 * 3. `prefers-color-scheme`
 */

export const THEME_DEV_STORAGE_KEY = "taya-theme-dev";
/** Persisted when the user picks Light/Dark from the account menu */
export const THEME_USER_STORAGE_KEY = "taya-theme";

export type DevThemeMode = "system" | "light" | "dark";

export const THEME_REFRESH_EVENT = "taya-theme-refresh";

export function isDevThemeChrome(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEV_MENU === "1"
  );
}

export function getResolvedTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";

  if (isDevThemeChrome()) {
    const o = localStorage.getItem(THEME_DEV_STORAGE_KEY);
    if (o === "light" || o === "dark") return o;
  }

  const user = localStorage.getItem(THEME_USER_STORAGE_KEY);
  if (user === "light" || user === "dark") return user;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyThemeToDocument(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
}

export function getDevThemeMode(): DevThemeMode {
  if (typeof window === "undefined") return "system";
  if (!isDevThemeChrome()) return "system";
  const o = localStorage.getItem(THEME_DEV_STORAGE_KEY);
  if (o === "light" || o === "dark") return o;
  return "system";
}

/** Persists dev override and syncs `data-theme`. No-op when dev chrome is off. */
export function setDevThemeOverride(mode: DevThemeMode) {
  if (typeof window === "undefined") return;
  if (!isDevThemeChrome()) return;

  if (mode === "system") {
    localStorage.removeItem(THEME_DEV_STORAGE_KEY);
  } else {
    localStorage.setItem(THEME_DEV_STORAGE_KEY, mode);
    localStorage.removeItem(THEME_USER_STORAGE_KEY);
  }

  const t = getResolvedTheme();
  applyThemeToDocument(t);
  window.dispatchEvent(new Event(THEME_REFRESH_EVENT));
}

/** User-facing Light / Dark from the account menu (works in production). */
export function setUserThemePreference(mode: "light" | "dark") {
  if (typeof window === "undefined") return;
  if (isDevThemeChrome()) {
    localStorage.removeItem(THEME_DEV_STORAGE_KEY);
  }
  localStorage.setItem(THEME_USER_STORAGE_KEY, mode);
  applyThemeToDocument(mode);
  window.dispatchEvent(new Event(THEME_REFRESH_EVENT));
}
