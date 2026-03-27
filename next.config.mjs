/** @type {import('next').NextConfig} */
const nextConfig = {
  // Supabase in server bundles is split into vendor-chunks; under dev/HMR those
  // chunk paths can go stale (Cannot find module './vendor-chunks/@supabase.js').
  // Externalizing uses Node resolution instead of webpack vendor chunks.
  experimental: {
    serverComponentsExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],
  },
  // After a runtime error + Fast Refresh, webpack can serve a stale module graph
  // (__webpack_modules__[id] is not a function) and broken _next/static chunk URLs.
  // No persistent cache in dev avoids that; cold compile is slightly slower.
  webpack: (config, { dev }) => {
    if (dev) config.cache = false;
    return config;
  },
};

export default nextConfig;
