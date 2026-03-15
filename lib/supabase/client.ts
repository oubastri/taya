import { createBrowserClient } from "@supabase/ssr";

// Use this in Client Components ("use client") and hooks.
// It reads the session from a cookie that Supabase sets in the browser.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
