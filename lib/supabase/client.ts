import { createBrowserClient } from "@supabase/ssr";

// Use this in Client Components ("use client") and hooks.
// It reads the session from a cookie that Supabase sets in the browser.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Default GoTrue `navigatorLock` can hit Web Locks "steal" recovery (AbortError:
        // "Lock broken by another request with the 'steal' option") under React Strict Mode
        // or overlapping auth calls. Cookie-backed session still works; we only skip the
        // cross-tab exclusive lock (same as environments without LockManager).
        lock: async (_name, _acquireTimeout, fn) => fn(),
      },
    }
  );
}
