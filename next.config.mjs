const isProd = process.env.NODE_ENV === "production";

let supabaseImageHost = null;
try {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (u) supabaseImageHost = new URL(u).hostname;
} catch {
  supabaseImageHost = null;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: supabaseImageHost
      ? [
          {
            protocol: "https",
            hostname: supabaseImageHost,
            pathname: "/storage/v1/**",
          },
        ]
      : [],
  },
  // Supabase in server bundles is split into vendor-chunks; under dev/HMR those
  // chunk paths can go stale (Cannot find module './vendor-chunks/@supabase.js').
  // Externalizing uses Node resolution instead of webpack vendor chunks.
  experimental: {
    serverComponentsExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],
    ...(isProd
      ? {}
      : {
          // Dev only: don’t reuse stale App Router client cache after rapid edits.
          staleTimes: {
            dynamic: 0,
            static: 0,
          },
        }),
  },
  // After a runtime error + Fast Refresh, webpack can serve a stale module graph
  // (__webpack_modules__[id] is not a function) and broken _next/static chunk URLs.
  // No persistent cache in dev avoids that; cold compile is slightly slower.
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
      // Batch watcher events (e.g. multi-file agent edits) so HMR applies one coherent rebuild.
      config.watchOptions = {
        ...config.watchOptions,
        aggregateTimeout: 450,
      };
    }
    return config;
  },
  // In dev, kill browser/proxy caching of HTML and RSC responses so you don’t get a
  // mismatched document vs freshly emitted _next chunks (missing styles, wrong fonts, dead links).
  async headers() {
    if (isProd) return [];
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
