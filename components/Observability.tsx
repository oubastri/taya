"use client";

import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";

/**
 * Optional analytics — no-ops when not on Vercel / when env vars unset.
 * - Vercel Analytics: automatic on Vercel deployments when enabled in project dashboard.
 * - Plausible: set NEXT_PUBLIC_PLAUSIBLE_DOMAIN to your site domain (e.g. app.example.com).
 */
export function Observability() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <>
      <Analytics />
      {plausibleDomain ? (
        <Script
          defer
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      ) : null}
    </>
  );
}
